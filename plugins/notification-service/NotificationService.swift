import ImageIO
import Intents
import OSLog
import UIKit
import UserNotifications

final class NotificationService: UNNotificationServiceExtension {
  private static let logger = Logger(
    subsystem: Bundle.main.bundleIdentifier ?? "kr.storix.app.NotificationService",
    category: "TopicRoomPush"
  )

  private struct RecentSender {
    let userId: String
    let nickname: String
    let profileImageURL: String?
  }

  private var contentHandler: ((UNNotificationContent) -> Void)?
  private var bestAttemptContent: UNMutableNotificationContent?
  private var delivered = false

  override func didReceive(
    _ request: UNNotificationRequest,
    withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void
  ) {
    self.contentHandler = contentHandler

    let userInfo = request.content.userInfo
    let payloadType = stringValue(userInfo["type"])
    Self.logger.notice(
      "NSE invoked type=\(payloadType ?? "missing", privacy: .public) keys=\(self.payloadKeySummary(userInfo), privacy: .public)"
    )

    guard
      let content = request.content.mutableCopy() as? UNMutableNotificationContent,
      payloadType == "TOPIC_ROOM_CHAT"
    else {
      Self.logger.notice("NSE skipped because payload is not TOPIC_ROOM_CHAT")
      contentHandler(request.content)
      return
    }

    bestAttemptContent = content
    let messageCount = max(1, intValue(userInfo["messageCount"]) ?? 1)
    let senderNickname = stringValue(userInfo["senderNickname"])
      ?? stringValue(userInfo["title"])
      ?? "새 메시지"
    let notificationTitle = messageCount > 1
      ? "새 메시지 \(messageCount)건"
      : senderNickname
    let roomName = stringValue(userInfo["roomName"])
      ?? stringValue(userInfo["subtitle"])
      ?? ""
    let body = stringValue(userInfo["body"]) ?? content.body
    let threadId = stringValue(userInfo["threadId"])
      ?? topicRoomThreadId(from: userInfo)
      ?? request.identifier
    let recentSenderKey = recentSenderPayloadKey(in: userInfo)
    let recentSenders = recentSenders(from: recentSenderKey.flatMap { userInfo[$0] })
    let participantCount = intValue(userInfo["participantCount"])
    Self.logger.notice(
      "TOPIC_ROOM_CHAT parsed senderKey=\(recentSenderKey ?? "missing", privacy: .public) senderCount=\(recentSenders.count, privacy: .public) participantCount=\(participantCount ?? -1, privacy: .public) messageCount=\(messageCount, privacy: .public)"
    )
    writeDebugSnapshot(
      stage: "parsed",
      userInfo: userInfo,
      recentSenderKey: recentSenderKey,
      senderCount: recentSenders.count,
      participantCount: participantCount,
      messageCount: messageCount
    )

    content.threadIdentifier = threadId
    content.title = notificationTitle
    if !roomName.isEmpty {
      content.subtitle = roomName
    }
    content.body = body

    let topLevelProfileImageURL = stringValue(userInfo["senderProfileImageUrl"])
    let senders = recentSenders.isEmpty
      ? [
          RecentSender(
            userId: "\(threadId):sender",
            nickname: senderNickname,
            profileImageURL: topLevelProfileImageURL
          )
        ]
      : recentSenders.enumerated().map { index, sender in
          guard index == 0, sender.profileImageURL == nil else { return sender }
          return RecentSender(
            userId: sender.userId,
            nickname: sender.nickname,
            profileImageURL: topLevelProfileImageURL
          )
        }

    loadAvatars(for: senders) { [weak self] avatars in
      guard let self else { return }
      let latestSender = senders[0]
      let senderAvatar = avatars.first ?? self.defaultAvatar()
      let intentImage = senderAvatar.flatMap { $0.jpegData(compressionQuality: 0.85) }
        .map(INImage.init(imageData:))
      let sender = INPerson(
        personHandle: INPersonHandle(value: latestSender.userId, type: .unknown),
        nameComponents: nil,
        // INPerson must represent a real sender. Using "새 메시지 n건" as
        // the person name makes iOS lose the communication identity and fall
        // back to the app icon for bundled messages.
        displayName: latestSender.nickname,
        image: intentImage,
        contactIdentifier: nil,
        customIdentifier: latestSender.userId
      )
      let recipients = zip(senders.dropFirst(), avatars.dropFirst()).map { recentSender, avatar in
        INPerson(
          personHandle: INPersonHandle(value: recentSender.userId, type: .unknown),
          nameComponents: nil,
          displayName: recentSender.nickname,
          image: avatar.jpegData(compressionQuality: 0.85).map(INImage.init(imageData:)),
          contactIdentifier: nil,
          customIdentifier: recentSender.userId
        )
      }
      let intent = INSendMessageIntent(
        recipients: recipients.isEmpty ? nil : recipients,
        outgoingMessageType: .outgoingMessageText,
        content: body,
        speakableGroupName: roomName.isEmpty
          ? nil
          : INSpeakableString(spokenPhrase: roomName),
        conversationIdentifier: threadId,
        serviceName: nil,
        sender: sender,
        attachments: nil
      )
      // Topic rooms are group conversations because speakableGroupName is
      // present. iOS therefore prefers this conversation image over the
      // sender image. Set it for a single message as well, otherwise iOS may
      // fall back to the STORIX app icon even when the sender avatar exists.
      if let groupAvatar = self.compositeAvatar(from: avatars),
         let groupAvatarData = groupAvatar.pngData() {
        intent.setImage(
          INImage(imageData: groupAvatarData),
          forParameterNamed: \.speakableGroupName
        )
      }
      if let participantCount, participantCount > 1 {
        let metadata = INSendMessageIntentDonationMetadata()
        metadata.recipientCount = max(1, participantCount - 1)
        intent.donationMetadata = metadata
      }
      let interaction = INInteraction(intent: intent, response: nil)
      interaction.direction = .incoming
      interaction.donate(completion: nil)

      do {
        let updated = try content.updating(from: intent)
        self.writeDebugSnapshot(
          stage: "updated",
          userInfo: userInfo,
          recentSenderKey: recentSenderKey,
          senderCount: recentSenders.count,
          participantCount: participantCount,
          messageCount: messageCount
        )
        if let mutableUpdated = updated.mutableCopy() as? UNMutableNotificationContent {
          mutableUpdated.threadIdentifier = threadId
          mutableUpdated.title = notificationTitle
          if !roomName.isEmpty {
            mutableUpdated.subtitle = roomName
          }
          mutableUpdated.body = body
          self.finish(with: mutableUpdated)
        } else {
          self.finish(with: updated)
        }
      } catch {
        Self.logger.error(
          "Communication notification update failed error=\(String(describing: error), privacy: .public)"
        )
        self.writeDebugSnapshot(
          stage: "updateFailed",
          userInfo: userInfo,
          recentSenderKey: recentSenderKey,
          senderCount: recentSenders.count,
          participantCount: participantCount,
          messageCount: messageCount
        )
        self.finish(with: content)
      }
    }
  }

  override func serviceExtensionTimeWillExpire() {
    if let bestAttemptContent {
      finish(with: bestAttemptContent)
    }
  }

  private func finish(with content: UNNotificationContent) {
    guard !delivered else { return }
    delivered = true
    contentHandler?(content)
    contentHandler = nil
  }

  private func loadAvatar(
    from urlString: String?,
    completion: @escaping (UIImage?) -> Void
  ) {
    guard let urlString, let url = URL(string: urlString) else {
      completion(defaultAvatar())
      return
    }

    var request = URLRequest(url: url)
    request.timeoutInterval = 4
    URLSession.shared.dataTask(with: request) { [weak self] data, _, _ in
      guard let self else { return }
      let avatar = data.flatMap { self.downsampledImage(data: $0, maxPixelSize: 160) }
      completion(avatar ?? self.defaultAvatar())
    }.resume()
  }

  private func loadAvatars(
    for senders: [RecentSender],
    completion: @escaping ([UIImage]) -> Void
  ) {
    let group = DispatchGroup()
    let lock = NSLock()
    var images = Array<UIImage?>(repeating: nil, count: senders.count)

    for (index, sender) in senders.enumerated() {
      group.enter()
      loadAvatar(from: sender.profileImageURL) { [weak self] image in
        guard let self else {
          group.leave()
          return
        }
        lock.lock()
        images[index] = image ?? self.placeholderAvatar()
        lock.unlock()
        group.leave()
      }
    }

    group.notify(queue: .global(qos: .userInitiated)) { [weak self] in
      guard let self else { return }
      completion(images.map { $0 ?? self.placeholderAvatar() })
    }
  }

  private func recentSenders(from value: Any?) -> [RecentSender] {
    let rawArray: [Any]
    if let string = value as? String,
       let data = string.data(using: .utf8),
       let decoded = try? JSONSerialization.jsonObject(with: data) as? [Any] {
      rawArray = decoded
    } else if let array = value as? [Any] {
      rawArray = array
    } else {
      return []
    }

    var seen = Set<String>()
    var result: [RecentSender] = []
    for case let sender as [String: Any] in rawArray {
      guard
        let userId = stringValue(sender["userId"] ?? sender["senderId"]),
        let nickname = stringValue(
          sender["nickname"] ?? sender["nickName"] ?? sender["senderNickname"]
        ),
        seen.insert(userId).inserted
      else { continue }

      result.append(
        RecentSender(
          userId: userId,
          nickname: nickname,
          profileImageURL: stringValue(
            sender["profileImageUrl"] ?? sender["senderProfileImageUrl"]
          )
        )
      )
      if result.count == 3 { break }
    }
    return result
  }

  private func recentSenderPayloadKey(in userInfo: [AnyHashable: Any]) -> String? {
    ["recentSenders", "recentSenderProfiles", "senderProfiles"].first {
      userInfo[$0] != nil
    }
  }

  private func payloadKeySummary(_ userInfo: [AnyHashable: Any]) -> String {
    userInfo.keys
      .map { String(describing: $0) }
      .sorted()
      .joined(separator: ",")
  }

  private func writeDebugSnapshot(
    stage: String,
    userInfo: [AnyHashable: Any],
    recentSenderKey: String?,
    senderCount: Int,
    participantCount: Int?,
    messageCount: Int
  ) {
#if DEBUG
    let snapshot: [String: Any] = [
      "stage": stage,
      "receivedAt": ISO8601DateFormatter().string(from: Date()),
      "type": stringValue(userInfo["type"]) ?? "missing",
      "keys": userInfo.keys.map { String(describing: $0) }.sorted(),
      "recentSenderKey": recentSenderKey ?? "missing",
      "senderCount": senderCount,
      "participantCount": participantCount ?? -1,
      "messageCount": messageCount,
      "hasRoomName": stringValue(userInfo["roomName"] ?? userInfo["subtitle"]) != nil,
      "hasSenderProfileImageUrl": stringValue(userInfo["senderProfileImageUrl"]) != nil,
    ]
    guard
      let data = try? JSONSerialization.data(withJSONObject: snapshot, options: [.prettyPrinted]),
      let documents = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first
    else { return }
    try? FileManager.default.createDirectory(
      at: documents,
      withIntermediateDirectories: true
    )
    try? data.write(to: documents.appendingPathComponent("topic-room-push-debug.json"))
#endif
  }

  private func compositeAvatar(from images: [UIImage]) -> UIImage? {
    // Keep the group mark readable at notification size: Slack-style uses two
    // overlapping circular portraits, while the app badge is added by iOS.
    let avatars = Array(images.prefix(2))
    guard avatars.count > 1 else { return avatars.first }

    let canvasSize = CGSize(width: 160, height: 160)
    let format = UIGraphicsImageRendererFormat()
    format.opaque = false
    format.scale = 1
    let renderer = UIGraphicsImageRenderer(size: canvasSize, format: format)
    return renderer.image { context in
      context.cgContext.clear(CGRect(origin: .zero, size: canvasSize))
      drawCircularAvatar(
        avatars[1],
        center: CGPoint(x: 59, y: 59),
        diameter: 102,
        context: context.cgContext
      )
      drawCircularAvatar(
        avatars[0],
        center: CGPoint(x: 101, y: 101),
        diameter: 102,
        context: context.cgContext
      )
    }
  }

  private func drawCircularAvatar(
    _ image: UIImage,
    center: CGPoint,
    diameter: CGFloat,
    context: CGContext
  ) {
    let rect = CGRect(
      x: center.x - diameter / 2,
      y: center.y - diameter / 2,
      width: diameter,
      height: diameter
    )
    let path = UIBezierPath(ovalIn: rect)
    context.saveGState()
    path.addClip()
    drawAspectFill(image, in: rect)
    context.restoreGState()
  }

  private func drawAspectFill(_ image: UIImage, in rect: CGRect) {
    let scale = max(rect.width / image.size.width, rect.height / image.size.height)
    let size = CGSize(width: image.size.width * scale, height: image.size.height * scale)
    image.draw(
      in: CGRect(
        x: rect.midX - size.width / 2,
        y: rect.midY - size.height / 2,
        width: size.width,
        height: size.height
      )
    )
  }

  private func downsampledImage(data: Data, maxPixelSize: CGFloat) -> UIImage? {
    guard let source = CGImageSourceCreateWithData(data as CFData, nil) else {
      return nil
    }
    let options: [CFString: Any] = [
      kCGImageSourceCreateThumbnailFromImageAlways: true,
      kCGImageSourceThumbnailMaxPixelSize: maxPixelSize,
      kCGImageSourceCreateThumbnailWithTransform: true,
      kCGImageSourceShouldCacheImmediately: false,
    ]
    guard let cgImage = CGImageSourceCreateThumbnailAtIndex(source, 0, options as CFDictionary) else {
      return nil
    }
    return UIImage(cgImage: cgImage)
  }

  private func defaultAvatar() -> UIImage? {
    UIImage(named: "profile-default", in: Bundle.main, compatibleWith: nil)
  }

  private func placeholderAvatar() -> UIImage {
    if let image = defaultAvatar() { return image }
    return UIGraphicsImageRenderer(size: CGSize(width: 160, height: 160)).image { context in
      UIColor.systemGray4.setFill()
      context.fill(CGRect(x: 0, y: 0, width: 160, height: 160))
    }
  }

  private func topicRoomThreadId(from userInfo: [AnyHashable: Any]) -> String? {
    guard let targetId = stringValue(userInfo["targetId"]), !targetId.isEmpty else {
      return nil
    }
    return "topic-room-\(targetId)"
  }

  private func intValue(_ value: Any?) -> Int? {
    guard let value else { return nil }
    return Int(String(describing: value))
  }

  private func stringValue(_ value: Any?) -> String? {
    guard let value else { return nil }
    let string = String(describing: value).trimmingCharacters(in: .whitespacesAndNewlines)
    return string.isEmpty ? nil : string
  }
}
