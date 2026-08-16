package kr.storix.topicroomnotification

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.BitmapShader
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RectF
import android.graphics.Shader
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.app.Person
import androidx.core.content.LocusIdCompat
import androidx.core.content.pm.ShortcutInfoCompat
import androidx.core.content.pm.ShortcutManagerCompat
import androidx.core.graphics.drawable.IconCompat
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.net.HttpURLConnection
import java.net.URL

private const val CHANNEL_ID = "storix_default_high"
private const val AVATAR_SIZE = 192

class TopicRoomNotificationSenderRecord : Record {
  @Field
  var id: String = ""

  @Field
  var nickname: String = ""

  @Field
  var profileImageUrl: String? = null
}

class TopicRoomNotificationOptionsRecord : Record {
  @Field
  var roomId: Int = 0

  @Field
  var threadId: String = ""

  @Field
  var roomName: String = ""

  @Field
  var displayTitle: String = ""

  @Field
  var message: String = ""

  @Field
  var messageCount: Int = 1

  @Field
  var senderName: String = ""

  @Field
  var senderId: String = ""

  @Field
  var senderProfileImageUrl: String? = null

  @Field
  var recentSenders: List<TopicRoomNotificationSenderRecord> = emptyList()

  @Field
  var data: Map<String, String> = emptyMap()
}

class TopicRoomNotificationModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("StorixTopicRoomNotification")

    AsyncFunction("display") Coroutine { options: TopicRoomNotificationOptionsRecord ->
      displayConversationNotification(options)
    }

    AsyncFunction("cancel") { threadId: String ->
      if (threadId.isNotBlank()) {
        NotificationManagerCompat.from(context).cancel(threadId, 0)
      }
    }
  }

  private suspend fun displayConversationNotification(
    options: TopicRoomNotificationOptionsRecord
  ) {
    if (options.roomId <= 0 || options.threadId.isBlank()) return

    val senders = normalizedSenders(options)
    val senderAvatars = senders.map { sender ->
      sender to loadBitmap(sender.profileImageUrl)
    }
    val latestAvatar = loadBitmap(options.senderProfileImageUrl)
      ?: senderAvatars.firstOrNull()?.second
      ?: createDefaultAvatar()
    // Always lead with the explicitly supplied latest-sender image (or the
    // default-profile fallback) so stale recentSenders data cannot replace it.
    val avatarBitmaps = buildList {
      add(latestAvatar)
      senderAvatars
        .filter { (sender, _) -> sender.id != options.senderId }
        .forEach { (sender, avatar) ->
          add(avatar ?: createDefaultAvatar())
        }
    }
    val shortcutAvatar = createConversationAvatar(
      avatarBitmaps.ifEmpty { listOf(latestAvatar) }
    )

    ensureChannel()
    publishConversationShortcut(options, senderAvatars, shortcutAvatar)
    postNotification(options, latestAvatar)
  }

  private fun normalizedSenders(
    options: TopicRoomNotificationOptionsRecord
  ): List<TopicRoomNotificationSenderRecord> {
    val unique = LinkedHashMap<String, TopicRoomNotificationSenderRecord>()
    options.recentSenders.forEach { sender ->
      if (sender.id.isNotBlank() && sender.nickname.isNotBlank()) {
        unique.putIfAbsent(sender.id, sender)
      }
    }
    if (unique.isEmpty()) {
      unique[options.senderId] = TopicRoomNotificationSenderRecord().apply {
        id = options.senderId
        nickname = options.senderName
        profileImageUrl = options.senderProfileImageUrl
      }
    }
    return unique.values.take(3)
  }

  private fun ensureChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val manager = context.getSystemService(NotificationManager::class.java)
    if (manager.getNotificationChannel(CHANNEL_ID) != null) return

    manager.createNotificationChannel(
      NotificationChannel(
        CHANNEL_ID,
        "STORIX 알림",
        NotificationManager.IMPORTANCE_HIGH
      ).apply {
        enableVibration(true)
        setShowBadge(true)
      }
    )
  }

  private fun publishConversationShortcut(
    options: TopicRoomNotificationOptionsRecord,
    senderAvatars: List<Pair<TopicRoomNotificationSenderRecord, Bitmap?>>,
    shortcutAvatar: Bitmap
  ) {
    val people = senderAvatars.map { (sender, avatar) ->
      Person.Builder()
        .setKey(sender.id)
        .setName(sender.nickname)
        .setUri("storix-user:${sender.id}")
        .setIcon(
          IconCompat.createWithBitmap(avatar ?: createDefaultAvatar())
        )
        .build()
    }
    val shortcut = ShortcutInfoCompat.Builder(context, options.threadId)
      .setShortLabel(options.roomName.take(40).ifBlank { "토픽룸" })
      .setLongLabel(options.roomName.take(80).ifBlank { "STORIX 토픽룸" })
      // Keep the transparent multi-avatar composition instead of forcing an
      // adaptive-icon mask, which adds a solid background on some Samsung OSes.
      .setIcon(IconCompat.createWithBitmap(shortcutAvatar))
      .setIntent(createOpenIntent(options))
      .setLongLived(true)
      .setLocusId(LocusIdCompat(options.threadId))
      .setPersons(people.toTypedArray())
      .build()

    ShortcutManagerCompat.pushDynamicShortcut(context, shortcut)
  }

  private fun postNotification(
    options: TopicRoomNotificationOptionsRecord,
    senderAvatar: Bitmap
  ) {
    val senderLabel = if (options.messageCount > 1) {
      options.displayTitle
    } else {
      options.senderName
    }
    val sender = Person.Builder()
      .setKey(options.senderId)
      .setName(senderLabel)
      .setUri("storix-user:${options.senderId}")
      // Samsung creates a colored initial when MessagingStyle's sender has no
      // icon. Supplying the downloaded profile bitmap keeps the conversation
      // notification consistent with iOS communication notifications.
      // One UI does not consistently mask Person icons, so provide a bitmap
      // whose corners are already transparent instead of the square source.
      .setIcon(
        IconCompat.createWithBitmap(circularBitmap(senderAvatar, AVATAR_SIZE))
      )
      .build()
    val currentUser = Person.Builder()
      .setKey("storix-current-user")
      .setName("나")
      .build()
    val style = NotificationCompat.MessagingStyle(currentUser)
      .setConversationTitle(options.roomName)
      .setGroupConversation(true)
      .addMessage(options.message, System.currentTimeMillis(), sender)

    val notification = NotificationCompat.Builder(context, CHANNEL_ID)
      // Android notification small icons must be monochrome with a transparent
      // background. A launcher/adaptive icon is rendered as a broken square
      // badge on Samsung One UI.
      .setSmallIcon(R.drawable.ic_stat_storix)
      .setContentTitle(options.roomName)
      .setContentText(options.message)
      .setStyle(style)
      .setCategory(NotificationCompat.CATEGORY_MESSAGE)
      .setPriority(NotificationCompat.PRIORITY_HIGH)
      .setContentIntent(createContentIntent(options))
      .setAutoCancel(true)
      .setOnlyAlertOnce(false)
      .setShortcutId(options.threadId)
      .setLocusId(LocusIdCompat(options.threadId))
      .build()

    NotificationManagerCompat.from(context).notify(options.threadId, 0, notification)
  }

  private fun createOpenIntent(options: TopicRoomNotificationOptionsRecord): Intent {
    val deepLink = Uri.parse(
      "storixfe21:///topicroom/${options.roomId}" +
        "?entrySource=notification&topicRoomName=${Uri.encode(options.roomName)}"
    )
    return Intent(Intent.ACTION_VIEW, deepLink).apply {
      setPackage(context.packageName)
    }
  }

  private fun createContentIntent(options: TopicRoomNotificationOptionsRecord): PendingIntent {
    val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
      ?: createOpenIntent(options)
    launchIntent.action = Intent.ACTION_VIEW
    launchIntent.data = createOpenIntent(options).data
    launchIntent.flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
    return PendingIntent.getActivity(
      context,
      options.roomId,
      launchIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
  }

  private suspend fun loadBitmap(urlString: String?): Bitmap? = withContext(Dispatchers.IO) {
    if (urlString.isNullOrBlank()) return@withContext null
    runCatching {
      val uri = Uri.parse(urlString)
      when (uri.scheme?.lowercase()) {
        "http", "https" -> {
          val connection = URL(urlString).openConnection() as HttpURLConnection
          try {
            connection.connectTimeout = 3500
            connection.readTimeout = 3500
            connection.instanceFollowRedirects = true
            connection.setRequestProperty("Accept", "image/*")
            connection.setRequestProperty("User-Agent", "STORIX-Android")
            connection.connect()
            if (connection.responseCode !in 200..299) {
              null
            } else {
              connection.inputStream.use { BitmapFactory.decodeStream(it) }
            }
          } finally {
            connection.disconnect()
          }
        }
        "content", "android.resource" -> context.contentResolver
          .openInputStream(uri)
          ?.use { BitmapFactory.decodeStream(it) }
        "file" -> BitmapFactory.decodeFile(uri.path)
        "asset" -> loadBundledAsset(uri)
        // React Native release assets resolve to an Android drawable resource
        // identifier such as "placeholders_profiledefault", not a file URI.
        null -> loadDrawableResource(urlString) ?: BitmapFactory.decodeFile(urlString)
        else -> BitmapFactory.decodeFile(urlString)
      }
    }.getOrNull()
  }

  private fun loadBundledAsset(uri: Uri): Bitmap? {
    val assetPath = uri.path?.trimStart('/').orEmpty()
    runCatching {
      context.assets.open(assetPath).use { return BitmapFactory.decodeStream(it) }
    }

    return loadDrawableResource(assetPath)
  }

  private fun loadDrawableResource(value: String): Bitmap? {
    val resourceName = value
      .substringAfterLast('/')
      .substringBeforeLast('.')
      .replace(Regex("[^A-Za-z0-9_]"), "_")
      .lowercase()
    val resourceId = context.resources.getIdentifier(
      resourceName,
      "drawable",
      context.packageName
    )
    return resourceId.takeIf { it != 0 }?.let {
      BitmapFactory.decodeResource(context.resources, it)
    }
  }

  private fun createConversationAvatar(images: List<Bitmap>): Bitmap {
    val selected = images.take(2)
    if (selected.size == 1) return circularBitmap(selected[0], AVATAR_SIZE)

    val output = Bitmap.createBitmap(AVATAR_SIZE, AVATAR_SIZE, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(output)
    canvas.drawColor(Color.TRANSPARENT)
    val diameter = 108f
    drawCircleImage(canvas, selected[1], 66f, 66f, diameter)
    drawCircleImage(canvas, selected[0], 126f, 126f, diameter)
    return output
  }

  private fun circularBitmap(source: Bitmap, size: Int): Bitmap {
    val output = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(output)
    drawCircleImage(canvas, source, size / 2f, size / 2f, size.toFloat())
    return output
  }

  private fun drawCircleImage(
    canvas: Canvas,
    source: Bitmap,
    centerX: Float,
    centerY: Float,
    diameter: Float
  ) {
    val shader = BitmapShader(source, Shader.TileMode.CLAMP, Shader.TileMode.CLAMP)
    val scale = maxOf(diameter / source.width, diameter / source.height)
    val matrix = android.graphics.Matrix().apply {
      setScale(scale, scale)
      postTranslate(
        centerX - source.width * scale / 2f,
        centerY - source.height * scale / 2f
      )
    }
    shader.setLocalMatrix(matrix)
    canvas.drawOval(
      RectF(
        centerX - diameter / 2f,
        centerY - diameter / 2f,
        centerX + diameter / 2f,
        centerY + diameter / 2f
      ),
      Paint(Paint.ANTI_ALIAS_FLAG).apply { this.shader = shader }
    )
  }

  private fun createDefaultAvatar(): Bitmap {
    val output = Bitmap.createBitmap(AVATAR_SIZE, AVATAR_SIZE, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(output)
    canvas.drawColor(Color.rgb(255, 58, 141))

    val center = AVATAR_SIZE / 2f
    val outer = AVATAR_SIZE * 0.31f
    val inner = AVATAR_SIZE * 0.09f
    val star = Path().apply {
      moveTo(center, center - outer)
      cubicTo(center - inner, center - inner, center - inner, center - inner, center - outer, center)
      cubicTo(center - inner, center + inner, center - inner, center + inner, center, center + outer)
      cubicTo(center + inner, center + inner, center + inner, center + inner, center + outer, center)
      cubicTo(center + inner, center - inner, center + inner, center - inner, center, center - outer)
      close()
    }
    canvas.drawPath(
      star,
      Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.WHITE }
    )
    return output
  }
}
