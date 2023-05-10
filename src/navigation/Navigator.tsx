import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { Screens } from './Screens';
import type { StackParamList } from './types';
import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  useBottomSheetDynamicSnapPoints,
} from '@gorhom/bottom-sheet';
import { createBottomSheetNavigator } from '@th3rdwave/react-navigation-bottom-sheet';
import ErrorScreen from '../shared/ErrorScreen';
import { noHeader, emptyHeader } from './Headers';
import WelcomeScreen from '../screens/WelcomeScreen';
import AppLoading from '../shared/AppLoading';
import SplashScreen from 'react-native-splash-screen';
import Logger from '../utils/logger';
import LanguageChooser from '../screens/LanguageChooserScreen';
import type { ExtractProps } from '../utils/helpers';
import DrawerNavigator from './DrawerNavigator';
import { useStoreState } from '../state/hooks';
import { PinType } from '../utils/types';
import DisclaimerScreen from '../shared/DisclaimerScreen';
import SetPinScreen from '../screens/SetPinScreen';
import EnableBiometry from '../screens/EnableBiometryScreen';
import EnterPin from '../shared/EnterPinScreen';
import ReceiveScreen from '../screens/ReceiveScreen';
import LightningChannelsIntroScreen from '../screens/LightningChannelsIntro';
import JITLiquidityScreen from '../screens/JITLiquidityScreen';
import ActivityScreen from '../screens/ActivityScreen';
import ActivityDetailsScreen from '../screens/ActivityDetailsScreen';
import SendScreen from '../screens/SendScreen';
import StartLdkScreen from '../screens/StartLdkScreen';
import ScanQRCodeScreen from '../screens/ScanQRCodeScreen';

const TAG = 'Navigator';

const Stack = createNativeStackNavigator<StackParamList>();
const AnimatedStack = createNativeStackNavigator<StackParamList>();
const RootStack = createBottomSheetNavigator<StackParamList>();

type InitialRouteName = ExtractProps<typeof Stack.Navigator>['initialRouteName'];

const commonScreens = (Navigator: typeof Stack) => {
  return (
    <>
      <Navigator.Screen name={Screens.ErrorScreen} component={ErrorScreen} options={noHeader} />
    </>
  );
};

const walletScreens = (Navigator: typeof Stack) => {
  return (
    <>
      <Navigator.Screen
        name={Screens.LightningChannelsIntroScreen}
        component={LightningChannelsIntroScreen}
        options={LightningChannelsIntroScreen.navigationOptions as NativeStackNavigationOptions}
      />
      <Navigator.Screen
        name={Screens.JITLiquidityScreen}
        component={JITLiquidityScreen}
        options={JITLiquidityScreen.navigationOptions as NativeStackNavigationOptions}
      />
      <Navigator.Screen
        name={Screens.ReceiveScreen}
        component={ReceiveScreen}
        options={ReceiveScreen.navigationOptions as NativeStackNavigationOptions}
      />
      <Navigator.Screen
        name={Screens.SendScreen}
        component={SendScreen}
        options={SendScreen.navigationOptions as NativeStackNavigationOptions}
      />
      <Navigator.Screen
        name={Screens.ScanQRCodeScreen}
        component={ScanQRCodeScreen}
        options={ScanQRCodeScreen.navigationOptions as NativeStackNavigationOptions}
      />
      <Navigator.Screen
        name={Screens.ActivityScreen}
        component={ActivityScreen}
        options={ActivityScreen.navigationOptions as NativeStackNavigationOptions}
      />
      <Navigator.Screen
        name={Screens.ActivityDetailsScreen}
        component={ActivityDetailsScreen}
        options={ActivityDetailsScreen.navigationOptions as NativeStackNavigationOptions}
      />
    </>
  );
};

const onboardingScreens = (Navigator: typeof Stack) => {
  return (
    <>
      <Navigator.Screen
        name={Screens.SetPinScreen}
        component={SetPinScreen}
        options={SetPinScreen.navigationOptions}
      />
      <Navigator.Screen
        name={Screens.EnableBiometryScreen}
        component={EnableBiometry}
        options={EnableBiometry.navigationOptions}
      />
      <Navigator.Screen
        name={Screens.StartLdkScreen}
        component={StartLdkScreen}
        options={StartLdkScreen.navOptions}
      />
      <Navigator.Screen
        name={Screens.WelcomeScreen}
        component={WelcomeScreen}
        options={WelcomeScreen.navigationOptions}
      />
    </>
  );
};

export const MainStackScreen = () => {
  const [initialRouteName, setInitialRoute] = useState<InitialRouteName>(undefined);
  // @todo: updated state via thunk not being rehydrated on app reload. Look into this
  const choseRestoreWallet = useStoreState((state) => state.nuxt.choseRestoreWallet);
  const acknowledgedDisclaimer = useStoreState((state) => state.nuxt.acknowledgedDisclaimer);
  const pinType = useStoreState((state) => state.nuxt.pincodeType);
  const userStarted = useStoreState((state) => state.nuxt.userStarted);
  const slidesSeen = useStoreState((state) => state.nuxt.seenSlides);
  const nodeIsUp = useStoreState((state) => state.lightning.nodeStarted);

  useEffect(() => {
    let initialRoute: InitialRouteName;
    if (!acknowledgedDisclaimer || pinType === PinType.Unset) {
      initialRoute = Screens.WelcomeScreen;
    } else if (!nodeIsUp) {
      initialRoute = choseRestoreWallet ? Screens.RestoreWalletScreen : Screens.StartLdkScreen;
    } else {
      initialRoute = Screens.DrawerNavigator;
    }

    setInitialRoute(initialRoute);
    Logger.info(`${TAG}@MainStackScreen`, `Initial route: ${initialRoute}`);

    // Wait for next frame to avoid slight gap when hiding the splash
    requestAnimationFrame(() => SplashScreen.hide());
  }, [acknowledgedDisclaimer, choseRestoreWallet, slidesSeen, userStarted, pinType, nodeIsUp]);

  if (!initialRouteName) {
    return <AppLoading />;
  }

  return (
    <Stack.Navigator initialRouteName={initialRouteName} screenOptions={emptyHeader}>
      <Stack.Screen name={Screens.DrawerNavigator} component={DrawerNavigator} options={noHeader} />
      {onboardingScreens(Stack)}
      {walletScreens(Stack)}
      {commonScreens(Stack)}
    </Stack.Navigator>
  );
};

const modalAnimatedScreens = (Navigator: typeof Stack) => (
  <>
    <Navigator.Screen
      name={Screens.Disclaimer}
      component={DisclaimerScreen}
      options={DisclaimerScreen.navigationOptions as NativeStackNavigationOptions}
    />
    <Navigator.Screen
      name={Screens.LanguageModal}
      component={LanguageChooser}
      options={LanguageChooser.navigationOptions() as NativeStackNavigationOptions}
    />
    <Navigator.Screen
      name={Screens.EnterPinScreen}
      component={EnterPin}
      options={EnterPin.navigationOptions as NativeStackNavigationOptions}
    />
  </>
);

export const modalScreenOptions = () =>
  Platform.select({
    // iOS 13 modal presentation
    ios: {
      presentation: 'modal',
    },
  });

const mainScreenNavOptions = () => ({
  ...modalScreenOptions(),
  headerShown: false,
});

function AnimatedStackScreen() {
  return (
    <AnimatedStack.Navigator>
      <AnimatedStack.Screen
        name={Screens.Main}
        component={MainStackScreen}
        options={mainScreenNavOptions as NativeStackNavigationOptions}
      />
      {modalAnimatedScreens(AnimatedStack)}
    </AnimatedStack.Navigator>
  );
}

const RootStackScreen = () => {
  const initialBottomSheetSnapPoints = React.useMemo(() => ['CONTENT_HEIGHT'], []);
  const { animatedHandleHeight, animatedSnapPoints, animatedContentHeight } =
    useBottomSheetDynamicSnapPoints(initialBottomSheetSnapPoints);

  const renderBackdrop = React.useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop opacity={0.25} appearsOnIndex={0} disappearsOnIndex={-1} {...props} />
    ),
    []
  );

  return (
    <RootStack.Navigator
      screenOptions={{
        backdropComponent: renderBackdrop,
        handleHeight: animatedHandleHeight,
        //@ts-ignore: React 18 types error pending PR: https://github.com/gorhom/react-native-bottom-sheet/pull/1123
        snapPoints: animatedSnapPoints,
        contentHeight: animatedContentHeight,
      }}
    >
      <>
        <RootStack.Screen name={Screens.AnimatedModal} component={AnimatedStackScreen} />
      </>
    </RootStack.Navigator>
  );
};

export default RootStackScreen;
