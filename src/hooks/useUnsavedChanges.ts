import { Alert } from 'react-native';
import { useNavigation, usePreventRemove } from '@react-navigation/native';
import { useAuth } from './useAuth';
import { useI18n } from '../i18n';

export const useUnsavedChanges = (dirty: boolean) => {
  const navigation = useNavigation(),
    { isAuthenticated } = useAuth(),
    { language } = useI18n();
  usePreventRemove(dirty && isAuthenticated, ({ data }) => {
    Alert.alert(
      language === 'en' ? 'Unsaved changes' : 'Kaydedilmemiş Değişiklikler',
      language === 'en'
        ? 'Discard your changes?'
        : 'Bu ekrandaki değişiklikler silinsin mi?',
      [
        {
          text: language === 'en' ? 'Keep editing' : 'Düzenlemeye Devam Et',
          style: 'cancel',
        },
        {
          text: language === 'en' ? 'Discard' : 'Değişiklikleri Sil',
          style: 'destructive',
          onPress: () => navigation.dispatch(data.action),
        },
      ],
    );
  });
};
