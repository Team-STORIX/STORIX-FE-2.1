import ImageIO
import Intents
import UIKit
import UserNotifications

final class NotificationService: UNNotificationServiceExtension {
  private var contentHandler: ((UNNotificationContent) -> Void)?
  private var bestAttemptContent: UNMutableNotificationContent?
  private var delivered = false

  override func didReceive(
    _ request: UNNotificationRequest,
    withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void
  ) {
    self.contentHandler = contentHandler

    guard
      let content = request.content.mutableCopy() as? UNMutableNotificationContent,
      stringValue(request.content.userInfo["type"]) == "TOPIC_ROOM_CHAT"
    else {
      contentHandler(request.content)
      return
    }

    bestAttemptContent = content
    let userInfo = request.content.userInfo
    let messageCount = max(1, intValue(userInfo["messageCount"]) ?? 1)
    let senderNickname = stringValue(userInfo["senderNickname"])
      ?? stringValue(userInfo["title"])
      ?? "새 메시지"
    let senderName = messageCount > 1
      ? "새 메시지 \(messageCount)건"
      : senderNickname
    let roomName = stringValue(userInfo["roomName"])
      ?? stringValue(userInfo["subtitle"])
      ?? ""
    let body = stringValue(userInfo["body"]) ?? content.body
    let threadId = stringValue(userInfo["threadId"])
      ?? topicRoomThreadId(from: userInfo)
      ?? request.identifier

    content.threadIdentifier = threadId
    if !roomName.isEmpty {
      content.subtitle = roomName
    }

    loadAvatar(from: stringValue(userInfo["senderProfileImageUrl"])) { [weak self] image in
      guard let self else { return }
      let intentImage = image.flatMap { $0.jpegData(compressionQuality: 0.85) }
        .map(INImage.init(imageData:))
      let sender = INPerson(
        personHandle: INPersonHandle(value: senderNickname, type: .unknown),
        nameComponents: nil,
        displayName: senderName,
        image: intentImage,
        contactIdentifier: nil,
        customIdentifier: "\(threadId):sender"
      )
      let intent = INSendMessageIntent(
        recipients: nil,
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
      let interaction = INInteraction(intent: intent, response: nil)
      interaction.direction = .incoming
      interaction.donate(completion: nil)

      do {
        let updated = try content.updating(from: intent)
        if let mutableUpdated = updated.mutableCopy() as? UNMutableNotificationContent {
          mutableUpdated.threadIdentifier = threadId
          if !roomName.isEmpty {
            mutableUpdated.subtitle = roomName
          }
          self.finish(with: mutableUpdated)
        } else {
          self.finish(with: updated)
        }
      } catch {
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
