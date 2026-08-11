const fs = require('fs')
const path = require('path')
const {
  withDangerousMod,
  withXcodeProject,
} = require('@expo/config-plugins')

const TARGET_NAME = 'STORIXNotificationService'
const TEMPLATE_DIR = path.join(__dirname, 'notification-service')

function unquote(value) {
  return typeof value === 'string' ? value.replace(/^"|"$/g, '') : value
}

function getTarget(project, name) {
  const section = project.pbxNativeTargetSection()
  for (const [uuid, target] of Object.entries(section)) {
    if (uuid.endsWith('_comment')) continue
    if (unquote(target.name) === name) return { uuid, target }
  }
  return null
}

function getTargetBuildSettings(project, target) {
  const configurationList =
    project.pbxXCConfigurationList()[target.buildConfigurationList]
  if (!configurationList) return []

  const configurationSection = project.pbxXCBuildConfigurationSection()
  return configurationList.buildConfigurations
    .map(({ value }) => configurationSection[value]?.buildSettings)
    .filter(Boolean)
}

function addNotificationServiceTarget(config) {
  return withXcodeProject(config, (modConfig) => {
    const project = modConfig.modResults
    const bundleIdentifier = modConfig.ios?.bundleIdentifier
    if (!bundleIdentifier) {
      throw new Error(
        '[withNotificationServiceExtension] ios.bundleIdentifier is required',
      )
    }

    const mainTarget = project.getFirstTarget()
    const mainSettings = getTargetBuildSettings(project, mainTarget.firstTarget)
    const developmentTeam = mainSettings
      .map((settings) => settings.DEVELOPMENT_TEAM)
      .find(Boolean)
    const deploymentTarget =
      mainSettings
        .map((settings) => settings.IPHONEOS_DEPLOYMENT_TARGET)
        .find(Boolean) ?? '15.1'

    const existingExtension = getTarget(project, TARGET_NAME)
    const extension =
      existingExtension ??
      project.addTarget(
        TARGET_NAME,
        'app_extension',
        TARGET_NAME,
        `${bundleIdentifier}.NotificationService`,
      )

    if (existingExtension == null) {
      project.addPbxGroup(
        [
          'NotificationService.swift',
          `${TARGET_NAME}-Info.plist`,
          `${TARGET_NAME}.entitlements`,
          'profile-default.png',
        ],
        TARGET_NAME,
        TARGET_NAME,
      )
      const extensionGroup = project.pbxGroupByName(TARGET_NAME)
      const groupSection = project.hash.project.objects.PBXGroup
      const extensionGroupUuid = Object.keys(groupSection).find(
        (key) => groupSection[key] === TARGET_NAME && key.endsWith('_comment'),
      )?.replace(/_comment$/, '')
      const mainGroupUuid = project.getFirstProject().firstProject.mainGroup
      if (extensionGroup && extensionGroupUuid && mainGroupUuid) {
        project.addToPbxGroup(extensionGroupUuid, mainGroupUuid)
      }

      project.addBuildPhase(
        ['NotificationService.swift'],
        'PBXSourcesBuildPhase',
        'Sources',
        extension.uuid,
      )
      project.addBuildPhase(
        ['profile-default.png'],
        'PBXResourcesBuildPhase',
        'Resources',
        extension.uuid,
      )
    }

    for (const settings of getTargetBuildSettings(
      project,
      extension.pbxNativeTarget ?? extension.target,
    )) {
      settings.APPLICATION_EXTENSION_API_ONLY = 'YES'
      settings.CODE_SIGN_ENTITLEMENTS = `"${TARGET_NAME}/${TARGET_NAME}.entitlements"`
      settings.CODE_SIGN_STYLE = 'Automatic'
      settings.CURRENT_PROJECT_VERSION = `"${modConfig.ios?.buildNumber ?? '1'}"`
      settings.GENERATE_INFOPLIST_FILE = 'NO'
      settings.INFOPLIST_FILE = `"${TARGET_NAME}/${TARGET_NAME}-Info.plist"`
      settings.IPHONEOS_DEPLOYMENT_TARGET = deploymentTarget
      settings.MARKETING_VERSION = `"${modConfig.version ?? '1.0.0'}"`
      settings.PRODUCT_BUNDLE_IDENTIFIER = `"${bundleIdentifier}.NotificationService"`
      settings.SWIFT_VERSION = '5.0'
      settings.TARGETED_DEVICE_FAMILY = '1'
      if (developmentTeam) settings.DEVELOPMENT_TEAM = developmentTeam
    }

    return modConfig
  })
}

function copyNotificationServiceFiles(config) {
  return withDangerousMod(config, [
    'ios',
    async (modConfig) => {
      const targetDir = path.join(
        modConfig.modRequest.platformProjectRoot,
        TARGET_NAME,
      )
      await fs.promises.mkdir(targetDir, { recursive: true })
      await Promise.all([
        fs.promises.copyFile(
          path.join(TEMPLATE_DIR, 'NotificationService.swift'),
          path.join(targetDir, 'NotificationService.swift'),
        ),
        fs.promises.copyFile(
          path.join(TEMPLATE_DIR, `${TARGET_NAME}-Info.plist`),
          path.join(targetDir, `${TARGET_NAME}-Info.plist`),
        ),
        fs.promises.copyFile(
          path.join(TEMPLATE_DIR, `${TARGET_NAME}.entitlements`),
          path.join(targetDir, `${TARGET_NAME}.entitlements`),
        ),
        fs.promises.copyFile(
          path.join(modConfig.modRequest.projectRoot, 'assets/placeholders/profile-default.png'),
          path.join(targetDir, 'profile-default.png'),
        ),
      ])
      return modConfig
    },
  ])
}

module.exports = function withNotificationServiceExtension(config) {
  return copyNotificationServiceFiles(addNotificationServiceTarget(config))
}
