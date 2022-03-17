import React from 'react';

import useTranslation from 'next-translate/useTranslation';
import { shallowEqual, useSelector } from 'react-redux';
import useSWR from 'swr';

import Spinner from '../dls/Spinner/Spinner';
import TranslationText from '../QuranReader/TranslationView/TranslationText';

import PlainVerseText from './PlainVerseText';
import styles from './VerseAndTranslation.module.scss';

import { fetcher } from 'src/api';
import Error from 'src/components/Error';
import useQcfFont from 'src/hooks/useQcfFont';
import { selectQuranReaderStyles } from 'src/redux/slices/QuranReader/styles';
import { selectSelectedTranslations } from 'src/redux/slices/QuranReader/translations';
import { getDefaultWordFields, getMushafId } from 'src/utils/api';
import { makeVersesUrl } from 'src/utils/apiPaths';
import { areArraysEqual } from 'src/utils/array';
import { getVerseWords } from 'src/utils/verse';
import { VersesResponse } from 'types/ApiResponses';

/**
 * Given a verse range
 * - Fetch the verse + translations data
 * - and return it
 *
 * The use case of this component is mainly for Verse and Translation that needs to be fetched on client
 * dynamically (not SSR). For example, for the reflection's feature verse reference
 *
 */
interface Props {
  chapter: number;
  from: number;
  to: number;
}

const VerseAndTranslation: React.FC<Props> = ({ chapter, from, to }) => {
  const { lang } = useTranslation();
  const translations = useSelector(selectSelectedTranslations, areArraysEqual);
  const { quranFont, mushafLines, translationFontScale } = useSelector(
    selectQuranReaderStyles,
    shallowEqual,
  );

  const mushafId = getMushafId(quranFont, mushafLines).mushaf;
  const apiParams = {
    ...getDefaultWordFields(quranFont),
    translationFields: 'resource_name,language_id',
    translations: translations.join(','),
    mushaf: mushafId,
    from: `${chapter}:${from}`,
    to: `${chapter}:${to}`,
  };

  const shouldFetchData = !!from;

  const { data, error, mutate } = useSWR<VersesResponse>(
    shouldFetchData ? makeVersesUrl(chapter, lang, apiParams) : null,
    fetcher,
  );

  useQcfFont(quranFont, data?.verses ? data.verses : []);

  if (error) return <Error error={error} onRetryClicked={mutate} />;

  if (!data) return <Spinner />;
  return (
    <div className={styles.container}>
      {data?.verses.map((verse) => (
        <div key={verse.verseKey} className={styles.verseContainer}>
          <div className={styles.arabicVerseContainer}>
            <PlainVerseText words={getVerseWords(verse)} />
          </div>
          <div className={styles.translationsListContainer}>
            {verse.translations?.map((translation) => (
              <div key={translation.id} className={styles.translationContainer}>
                <TranslationText
                  languageId={translation.languageId}
                  resourceName={translation.resourceName}
                  translationFontScale={translationFontScale}
                  text={translation.text}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default VerseAndTranslation;
