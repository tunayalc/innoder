import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';

export const selectUI = (state: RootState) => state.ui;

const normalizeLanguage = (language: unknown): 'tr' | 'en' =>
  language === 'en' ? 'en' : 'tr';

export const selectLanguage = createSelector(
  [selectUI],
  (ui) => normalizeLanguage(ui.language),
);

export const selectIsDarkMode = createSelector(
  [selectUI],
  (ui) => ui.isDarkMode,
);
