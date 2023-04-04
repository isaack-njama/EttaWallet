import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, TypographyPresets, Colors, Icon } from 'etta-ui';
import { SafeAreaView, View, StyleSheet, Text } from 'react-native';
import { navigate } from '../navigation/NavigationService';
import { Screens } from '../navigation/Screens';
import { initNavigationOptions } from '../navigation/Headers';
import LanguageButton from '../components/LanguageButton';
import { useStoreState, useStoreActions } from '../state/hooks';
import { APP_NAME } from '../../config';
import { PinType } from '../utils/types';
import mmkvStorage, { StorageItem } from '../storage/disk';

const WelcomeScreen = () => {
  const acknowledgedDisclaimer = useStoreState((state) => state.nuxt.acknowledgedDisclaimer);
  // const pincodeType = useStoreState((state) => state.nuxt.pincodeType);
  const pincodeType = mmkvStorage.getItem(StorageItem.pinType);
  const supportedBiometryType = useStoreState((state) => state.app.supportedBiometryType);
  const enabledBiometrics = mmkvStorage.getItem(StorageItem.enabledBiometrics);
  const skippedBiometrics = mmkvStorage.getItem(StorageItem.skippedBiometrics);
  // const skippedBiometrics = mmkvStorage.getItem(StorageItem.supportedBiometry);
  const setChoseRestore = useStoreActions((action) => action.nuxt.setChoseRestoreWallet);

  const navigateNext = () => {
    if (!acknowledgedDisclaimer) {
      navigate(Screens.Disclaimer);
    } else if (pincodeType === PinType.Unset) {
      navigate(Screens.SetPinScreen);
    } else if (
      supportedBiometryType !== null &&
      enabledBiometrics === false &&
      skippedBiometrics === false
    ) {
      navigate(Screens.EnableBiometryScreen);
    } else {
      navigate(Screens.DrawerNavigator);
    }
  };

  const createWalletHandler = () => {
    setChoseRestore(false);
    navigateNext();
  };

  const restoreWalletHandler = () => {
    setChoseRestore(true);
    navigateNext();
  };

  const { t } = useTranslation();
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headers}>
        <View style={styles.iconContainer}>
          <Icon name="icon-lightning" style={styles.appIcon} />
        </View>
        <Text style={styles.appName}>{APP_NAME}</Text>
        <Text style={styles.subtitle}>{t('welcome.subtitle')}</Text>
      </View>
      <View style={styles.headers}>
        <Button
          style={styles.button}
          title={t('welcome.createNewWallet')}
          appearance="filled"
          onPress={createWalletHandler}
        />
        <Button
          style={styles.button}
          title={t('welcome.restoreWallet')}
          appearance="transparent"
          onPress={restoreWalletHandler}
        />
      </View>
      <View>
        <Text style={styles.footer}>{t('welcome.footer')}</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    marginHorizontal: 32,
  },
  headers: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  iconContainer: {
    alignSelf: 'center',
    justifyContent: 'center',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#401D18',
    marginVertical: 20,
  },
  appIcon: {
    alignSelf: 'center',
    justifyContent: 'center',
    fontSize: 52,
    color: '#FF682C',
  },
  appName: {
    ...TypographyPresets.Header1,
    textAlign: 'center',
    color: '#401D18',
  },
  subtitle: {
    ...TypographyPresets.Body3,
    marginBottom: 50,
    textAlign: 'center',
    color: Colors.neutrals.light.neutral7,
  },
  button: {
    marginBottom: 10,
    justifyContent: 'center',
  },
  footer: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 'auto',
  },
});

export default WelcomeScreen;

WelcomeScreen.navigationOptions = {
  ...initNavigationOptions,
  headerRight: () => <LanguageButton />,
};