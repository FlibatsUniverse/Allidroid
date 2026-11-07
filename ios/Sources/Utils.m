#import "Utils.h"
#import "LoaderConfig.h"
#import "Logger.h"
#import <objc/message.h>
#import <spawn.h>
#import <sys/utsname.h>
#import <dlfcn.h>

BOOL isJailbroken = NO;

NSURL *getAllidroidDirectory(void) {
    AllidroidLog(@"getAllidroidDirectory: start");
    NSFileManager *fileManager  = [NSFileManager defaultManager];
    AllidroidLog(@"getAllidroidDirectory: got fileManager");
    NSURL *documentDirectoryURL = [[fileManager URLsForDirectory:NSDocumentDirectory
                                                   inDomains:NSUserDomainMask] lastObject];
    AllidroidLog(@"getAllidroidDirectory: documentDirectoryURL = %@", documentDirectoryURL);

    NSURL *allidroidFolderURL = [documentDirectoryURL URLByAppendingPathComponent:@"allidroid"];
    AllidroidLog(@"getAllidroidDirectory: allidroidFolderURL = %@", allidroidFolderURL);

    if (![fileManager fileExistsAtPath:allidroidFolderURL.path]) {
        AllidroidLog(@"getAllidroidDirectory: creating directory...");
        [fileManager createDirectoryAtURL:allidroidFolderURL
                  withIntermediateDirectories:YES
                                   attributes:nil
                                       error:nil];
        AllidroidLog(@"getAllidroidDirectory: directory created");
    }

    AllidroidLog(@"getAllidroidDirectory: returning %@", allidroidFolderURL);
    return allidroidFolderURL;
}

UIColor *hexToUIColor(NSString *hex) {
    if (![hex hasPrefix:@"#"]) {
        return nil;
    }

    NSString *hexColor = [hex substringFromIndex:1];
    if (hexColor.length == 6) {
        hexColor = [hexColor stringByAppendingString:@"ff"];
    }

    if (hexColor.length == 8) {
        unsigned int hexNumber;
        NSScanner *scanner = [NSScanner scannerWithString:hexColor];
        if ([scanner scanHexInt:&hexNumber]) {
            CGFloat r = ((hexNumber & 0xFF000000) >> 24) / 255.0;
            CGFloat g = ((hexNumber & 0x00FF0000) >> 16) / 255.0;
            CGFloat b = ((hexNumber & 0x0000FF00) >> 8) / 255.0;
            CGFloat a = (hexNumber & 0x000000FF) / 255.0;

            return [UIColor colorWithRed:r green:g blue:b alpha:a];
        }
    }

    return nil;
}

void showErrorAlert(NSString *title, NSString *message, void (^completion)(void)) {
    dispatch_async(dispatch_get_main_queue(), ^{
        UIAlertController *alert =
            [UIAlertController alertControllerWithTitle:title
                                                message:message
                                         preferredStyle:UIAlertControllerStyleAlert];

        UIAlertAction *okAction = [UIAlertAction actionWithTitle:@"OK"
                                                           style:UIAlertActionStyleDefault
                                                         handler:^(UIAlertAction *action) {
                                                             if (completion) {
                                                                 completion();
                                                             }
                                                         }];

        [alert addAction:okAction];

        UIWindow *window = nil;
        NSArray *windows = [[UIApplication sharedApplication] windows];
        for (UIWindow *w in windows) {
            if (w.isKeyWindow) {
                window = w;
                break;
            }
        }

        [window.rootViewController presentViewController:alert animated:YES completion:nil];
    });
}

NSString *getDeviceIdentifier(void) {
    struct utsname systemInfo;
    uname(&systemInfo);
    return [NSString stringWithCString:systemInfo.machine encoding:NSUTF8StringEncoding];
}

void reloadApp(UIViewController *viewController) {
    [viewController
        dismissViewControllerAnimated:NO
                           completion:^{
                               UIApplication *app = [UIApplication sharedApplication];
                               ((void (*)(id, SEL))objc_msgSend)(app, @selector(suspend));
                               dispatch_after(dispatch_time(DISPATCH_TIME_NOW, 0.5 * NSEC_PER_SEC),
                                              dispatch_get_main_queue(), ^{ exit(0); });
                           }];
}

void loadCustomBundleFromURL(NSURL *url, UIViewController *viewController) {
    LoaderConfig *config        = [LoaderConfig getLoaderConfig];
    config.customLoadUrlEnabled = YES;
    config.customLoadUrl        = url;
    if ([config saveConfig]) {
        reloadApp(viewController);
    } else {
        showErrorAlert(@"Error", @"Failed to save custom bundle configuration", nil);
    }
}

void deletePlugins(void) {
    [[NSFileManager defaultManager]
        removeItemAtURL:[getAllidroidDirectory() URLByAppendingPathComponent:@"plugins"]
                  error:nil];
}

void deleteThemes(void) {
    [[NSFileManager defaultManager]
        removeItemAtURL:[getAllidroidDirectory() URLByAppendingPathComponent:@"themes"]
                  error:nil];
}

void deleteAllData(UIViewController *presenter) {
    [[NSFileManager defaultManager] removeItemAtURL:getAllidroidDirectory() error:nil];
    gracefulExit(presenter);
}

void gracefulExit(UIViewController *presenter) {
    UIApplication *app = [UIApplication sharedApplication];
    [app performSelector:@selector(suspend)];

    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, 0.5 * NSEC_PER_SEC), dispatch_get_main_queue(),
                   ^{ [app performSelector:@selector(terminateWithSuccess)]; });
}

void setCustomBundleURL(NSURL *url, UIViewController *presenter) {
    LoaderConfig *config        = [LoaderConfig getLoaderConfig];
    config.customLoadUrlEnabled = YES;
    config.customLoadUrl        = url;
    [config saveConfig];
    removeCachedBundle();
    gracefulExit(presenter);
}

void resetCustomBundleURL(UIViewController *presenter) {
    LoaderConfig *config        = [LoaderConfig getLoaderConfig];
    config.customLoadUrlEnabled = NO;
    config.customLoadUrl        = [NSURL URLWithString:@"http://localhost:4040/allidroid.js"];
    [config saveConfig];
    removeCachedBundle();
    gracefulExit(presenter);
}

BOOL isSafeModeEnabled(void) {
    NSURL *documentDirectoryURL =
        [[NSFileManager defaultManager] URLsForDirectory:NSDocumentDirectory
                                               inDomains:NSUserDomainMask]
            .lastObject;
    NSURL *settingsURL =
        [documentDirectoryURL URLByAppendingPathComponent:@"compat_mmkv/ALLIDROID_SETTINGS"];

    NSData *data = [NSData dataWithContentsOfURL:settingsURL];
    if (!data)
        return NO;

    NSError *error         = nil;
    NSDictionary *settings = [NSJSONSerialization JSONObjectWithData:data options:0 error:&error];
    if (error)
        return NO;

    return [settings[@"safeMode"][@"enabled"] boolValue];
}

void toggleSafeMode(void) {
    NSURL *documentDirectoryURL =
        [[NSFileManager defaultManager] URLsForDirectory:NSDocumentDirectory
                                               inDomains:NSUserDomainMask]
            .lastObject;
    NSURL *settingsURL =
        [documentDirectoryURL URLByAppendingPathComponent:@"compat_mmkv/ALLIDROID_SETTINGS"];
    NSURL *themeURL = [documentDirectoryURL URLByAppendingPathComponent:@"compat_mmkv/ALLIDROID_THEMES"];

    NSData *data                  = [NSData dataWithContentsOfURL:settingsURL];
    NSMutableDictionary *settings = nil;

    if (data) {
        settings = [[NSJSONSerialization JSONObjectWithData:data
                                                    options:NSJSONReadingMutableContainers
                                                      error:nil] mutableCopy];
    } else {
        settings = [NSMutableDictionary dictionary];
    }

    if (!settings[@"safeMode"]) {
        settings[@"safeMode"] = [NSMutableDictionary dictionary];
    }

    BOOL currentState                 = [settings[@"safeMode"][@"enabled"] boolValue];
    BOOL newState                     = !currentState;
    settings[@"safeMode"][@"enabled"] = @(newState);

    NSData *themeData = [NSData dataWithContentsOfURL:themeURL];
    if (themeData) {
        NSDictionary *theme = [NSJSONSerialization JSONObjectWithData:themeData
                                                              options:0
                                                                error:nil];
        if (theme && theme[@"id"]) {
            if (newState) {
                settings[@"safeMode"][@"currentThemeId"] = theme[@"id"];
                [[NSFileManager defaultManager] removeItemAtURL:themeURL error:nil];
            }
        }
    }

    NSData *jsonData = [NSJSONSerialization dataWithJSONObject:settings options:0 error:nil];
    [jsonData writeToURL:settingsURL atomically:YES];

    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, 0.4 * NSEC_PER_SEC), dispatch_get_main_queue(),
                   ^{
                       UIViewController *rootVC =
                           [UIApplication sharedApplication].windows.firstObject.rootViewController;
                       reloadApp(rootVC);
                   });
}

NSURL *getBundleBackupURL(void) {
    return [getAllidroidDirectory() URLByAppendingPathComponent:@"bundle.js.backup"];
}

void moveCachedBundleToBackup(void) {
    NSFileManager *fm = [NSFileManager defaultManager];
    NSURL *bundleURL = [getAllidroidDirectory() URLByAppendingPathComponent:@"bundle.js"];
    NSURL *backupURL = getBundleBackupURL();

    if ([fm fileExistsAtPath:backupURL.path]) {
        NSError *removeError = nil;
        [fm removeItemAtURL:backupURL error:&removeError];
        if (removeError) {
            AllidroidLog(@"Failed to remove old backup: %@", removeError);
        }
    }

    if ([fm fileExistsAtPath:bundleURL.path]) {
        NSError *moveError = nil;
        [fm moveItemAtURL:bundleURL toURL:backupURL error:&moveError];
        if (moveError) {
            AllidroidLog(@"Failed to create bundle backup: %@", moveError);
        } else {
            AllidroidLog(@"Successfully moved bundle to backup");
        }
    } else {
        AllidroidLog(@"No cached bundle to backup");
    }
}

BOOL restoreBundleFromBackup(void) {
    NSFileManager *fm = [NSFileManager defaultManager];
    NSURL *bundleURL = [getAllidroidDirectory() URLByAppendingPathComponent:@"bundle.js"];
    NSURL *backupURL = getBundleBackupURL();

    if ([fm fileExistsAtPath:backupURL.path]) {
        if ([fm fileExistsAtPath:bundleURL.path]) {
            [fm removeItemAtURL:bundleURL error:nil];
        }

        NSError *error = nil;
        [fm moveItemAtURL:backupURL toURL:bundleURL error:&error];
        if (error) {
            AllidroidLog(@"Failed to restore bundle from backup: %@", error);
            return NO;
        }
        AllidroidLog(@"Successfully restored bundle from backup");
        return YES;
    }

    AllidroidLog(@"No backup bundle found to restore");
    return NO;
}

void cleanupBundleBackup(void) {
    NSFileManager *fm = [NSFileManager defaultManager];
    NSURL *backupURL = getBundleBackupURL();

    if ([fm fileExistsAtPath:backupURL.path]) {
        NSError *error = nil;
        [fm removeItemAtURL:backupURL error:&error];
        if (error) {
            AllidroidLog(@"Failed to cleanup backup: %@", error);
        } else {
            AllidroidLog(@"Cleaned up bundle backup");
        }
    }
}


void deletePluginsAndReload(UIViewController *presenter) {
    deletePlugins();
    reloadApp(presenter);
}

void deleteThemesAndReload(UIViewController *presenter) {
    deleteThemes();
    reloadApp(presenter);
}

void refetchBundle(UIViewController *presenter) {
    moveCachedBundleToBackup();
    reloadApp(presenter);
}

void removeCachedBundle(void) {
    NSError *error = nil;
    [[NSFileManager defaultManager]
        removeItemAtURL:[getAllidroidDirectory() URLByAppendingPathComponent:@"bundle.js"]
                  error:&error];
    if (error) {
        AllidroidLog(@"Failed to remove cached bundle: %@", error);
    }
}

BOOL isRNNewArchEnabled(void) {
    AllidroidLog(@"isRNNewArchEnabled: start");
    id raw = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"RCTNewArchEnabled"];
    AllidroidLog(@"isRNNewArchEnabled: raw = %@", raw);
    if (raw) {
        return [raw boolValue];
    }
    AllidroidLog(@"isRNNewArchEnabled: assuming YES (bridgeless)");
    return YES;
}

BOOL isHermesBytecode(NSData *data) {
    if (!data || data.length < 4) {
        return NO;
    }
    const uint8_t *bytes = (const uint8_t *)data.bytes;
    if (bytes[0] == 0xC6 && bytes[1] == 0x1F && bytes[2] == 0xBC && bytes[3] == 0x03) {
        return YES;
    }

    if (bytes[0] > 0x7F) {
        for (int i = 0; i < 4 && i < (int)data.length; i++) {
            if (bytes[i] == 0x00) return YES;
        }
    }
    return NO;
}
