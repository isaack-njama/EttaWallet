import React, { useState, useEffect, useLayoutEffect } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, View, Platform, ActivityIndicator, Dimensions, Text } from 'react-native';
import { HeaderTitleWithSubtitle, headerWithBackButton } from '../navigation/Headers';
import {
  addPeers,
  createLightningInvoice,
  getLightningStore,
  startLightning,
} from '../utils/lightning/helpers';
import { isLdkRunning, waitForLdk } from '../ldk';
import QRCode from 'react-native-qrcode-svg';
import { Colors, TypographyPresets } from 'etta-ui';
import { moderateScale } from '../utils/sizing';
import InvoiceActionsBar from '../components/InvoiceActionsBar';
import usePaymentRequestBottomSheet from '../components/usePaymentRequestBottomSheet';
import { StackParamList } from '../navigation/types';
import { Screens } from '../navigation/Screens';
import i18n from '../i18n';
import { humanizeTimestamp } from '../utils/time';
import { showErrorBanner, showToast } from '../utils/alerts';
import { navigate } from '../navigation/NavigationService';
import CancelButton from '../navigation/components/CancelButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '../components/Card';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import Clipboard from '@react-native-clipboard/clipboard';
import { cueInformativeHaptic } from '../utils/accessibility/haptics';
import AmountDisplay from '../components/amount/AmountDisplay';
import { TInvoice } from '@synonymdev/react-native-ldk';

const WINDOW_WIDTH = Dimensions.get('window').width;
const QR_CODE_WIDTH = WINDOW_WIDTH - 150;

type RouteProps = NativeStackScreenProps<StackParamList, Screens.ReceiveScreen>;
type Props = RouteProps;

const ReceiveScreen = ({ navigation, route }: Props) => {
  const [invoice, setInvoice] = useState<TInvoice | null>(null);
  const [timestamp, setTimestamp] = useState(0);
  const [expiry, setExpiry] = useState(3600);
  const [isLoading, setIsLoading] = useState(true);

  const amount = route.params?.amount || '0';
  const feesPayable = route.params?.feesPayable || 0;

  const onPressCancel = () => {
    navigate(Screens.WalletHomeScreen);
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <HeaderTitleWithSubtitle
          title="Payment request"
          subTitle="Keep open until payment is received"
        />
      ),
      headerRight: () => <CancelButton onCancel={onPressCancel} />,
    });
  }, [navigation]);

  // get expiry in epoch time as sum of timestamp/duration_since_epoch and expiry
  const invoiceExpires = humanizeTimestamp(timestamp + expiry, i18n);

  const { openPaymentRequestSheet, DetailedInvoiceBottomSheet } = usePaymentRequestBottomSheet({
    amountInSats: amount,
    feesPayable: feesPayable,
    expiresOn: invoiceExpires,
  });

  useEffect(() => {
    async function fetchInvoice() {
      try {
        // ensure Ldk is up
        const isLdkUp = await isLdkRunning();
        if (!isLdkUp) {
          await startLightning({});
        }
        await waitForLdk();

        // check that peers exist before we create invoice;
        addPeers().then();

        // proceed to create invoice
        const invoiceString = await createLightningInvoice({
          amountSats: parseInt(amount, 10), // amountSats is optional
          description: '',
          expiryDeltaSeconds: 3600,
        });

        if (invoiceString.isErr()) {
          console.log(invoiceString.error.message);
          return;
        }

        let updatedInvoice;

        const storedInvoices = getLightningStore().invoices;

        const matchingInvoice = storedInvoices.find(
          (inv) => inv?.payment_hash === invoiceString.value.payment_hash
        );
        if (matchingInvoice) {
          console.log('original invoice: ', invoiceString);
          updatedInvoice = matchingInvoice;
        }

        console.log('updated invoice: ', updatedInvoice);
        setIsLoading(false);
        setInvoice(updatedInvoice);
        setTimestamp(updatedInvoice.timestamp);
        setExpiry(updatedInvoice.expiry_time);
      } catch (e) {
        showErrorBanner({
          title: 'Something went wrong',
          message: e.message,
        });
      }
    }

    fetchInvoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount]);

  const onPressQR = () => {
    cueInformativeHaptic();
    Clipboard.setString(`lightning:${invoice?.to_str}` || '');
    showToast({ message: 'Invoice copied to clipboard' });
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.headerContainer}>
        <AmountDisplay inputAmount={amount} usingLocalCurrency={false} />
      </View>
      <View style={styles.qrContainer}>
        {isLoading ? (
          <ActivityIndicator color={Colors.orange.base} size={'large'} />
        ) : (
          <>
            <TouchableWithoutFeedback onPress={onPressQR}>
              <QRCode
                value={`lightning:${invoice?.to_str}`}
                size={QR_CODE_WIDTH}
                backgroundColor={Colors.common.white}
                color={Colors.common.black}
              />
              <Text
                numberOfLines={2}
                style={styles.advice}
              >{`This payment request will expire on \n ${invoiceExpires}`}</Text>
            </TouchableWithoutFeedback>

            <Card rounded={true} shadow={true} style={styles.statusCard}>
              <ActivityIndicator size={'small'} color={Colors.orange.base} />
              <Text style={styles.statusText}>Waiting for payment ...</Text>
            </Card>
          </>
        )}
      </View>
      <View style={styles.buttonContainer}>
        {isLoading ? (
          ''
        ) : (
          <InvoiceActionsBar
            paymentRequest={invoice?.to_str!}
            allowModifier={true}
            onPressDetails={openPaymentRequestSheet}
            smallButtons={true}
          />
        )}
      </View>
      {DetailedInvoiceBottomSheet}
    </SafeAreaView>
  );
};

ReceiveScreen.navigationOptions = {
  ...headerWithBackButton,
  ...Platform.select({
    ios: { animation: 'slide_from_bottom' },
  }),
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContainer: {
    flex: 1,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    ...TypographyPresets.Header3,
  },
  text: {
    color: Colors.neutrals.light.neutral6,
    marginHorizontal: moderateScale(16),
    textAlign: 'center',
  },
  advice: {
    ...TypographyPresets.Body5,
    marginVertical: 20,
    textAlign: 'center',
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutrals.light.neutral2,
  },
  statusText: {
    ...TypographyPresets.Body5,
    color: Colors.common.black,
    marginHorizontal: 12,
  },
});

export default ReceiveScreen;
