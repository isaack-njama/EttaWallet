import React from 'react';
import { StyleSheet, Text } from 'react-native';
import Touchable from '../components/Touchable';
import colors from '../styles/colors';
import fontStyles from '../styles/fonts';

interface Props {
  text: string;
  icon?: React.ReactNode;
  onPress: () => void;
  testID?: string;
}

const Pill = ({ text, icon, onPress, testID }: Props) => {
  return (
    <Touchable style={styles.container} onPress={onPress} testID={testID}>
      <>
        {icon}
        <Text style={[styles.text, icon ? { marginLeft: 5 } : {}]}>{text}</Text>
      </>
    </Touchable>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: colors.orangeBackground,
  },
  text: {
    ...fontStyles.small600,
    color: colors.dark,
  },
});

export default Pill;
