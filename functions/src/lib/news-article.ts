import { FirestoreDataConverter, QueryDocumentSnapshot, Timestamp, WithFieldValue } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { _NewsArticle, newsPortalDb, newsPortalStorage, serviceAccountSecretKey } from '../news-portal';
import { region } from '../util';
import { _Paths, _WebClientDoc } from '../util/types';

const imageUrlExpirationTimeMinutes = 5;
const converter = (): FirestoreDataConverter<_NewsArticleDtoWithoutImage> => ({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    toFirestore(docData: WithFieldValue<_NewsArticleDtoWithoutImage>): _NewsArticle {
        throw new Error('not implemented');
    },
    fromFirestore(snapshot: QueryDocumentSnapshot<_NewsArticle>): _NewsArticleDtoWithoutImage {
        const { creationDate, ...newsArticle} = snapshot.data();

        return ({
            ...newsArticle,
            id: snapshot.id,
            creationDateMillis: creationDate.toMillis(),
        });
    },
});
const getImageUrl = async (newsPortalServiceAccount: string, filePath: _NewsArticleDtoWithoutImage['image']) => {
    const bucket = newsPortalStorage(newsPortalServiceAccount).bucket();
    const file = bucket.file(filePath);

    const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + imageUrlExpirationTimeMinutes * 60 *1000,
    });

    return url;
}

export const findNewsArticle = onCall<string, Promise<_NewsArticleDto | undefined>>({
    cors: true,
    region,
    secrets: [serviceAccountSecretKey],
}, async ({ data: articleId, auth }) => {
    if (!(auth && auth.uid)) {
        throw new HttpsError('unauthenticated', 'User is not signed in');
    }

    const newsPortalServiceAccount = process.env[serviceAccountSecretKey];

    const newsArticleCollRef = newsPortalDb(newsPortalServiceAccount)
        .collection('news')
        .withConverter(converter());

    const docWithoutImage = await newsArticleCollRef.doc(articleId)
        .get()
        .then(doc => doc.data());

    if (!docWithoutImage) {
        return;
    }

    const {image, ...doc} = docWithoutImage;

    const imageUrl = await getImageUrl(newsPortalServiceAccount, image);

    return {
        ...doc,
        imageUrl,
    };
});

export const findNewsArticles = onCall<{ limit: number, lastDocCreationDateMillis?: number, }, Promise<{docs: _NewsArticleDto[], hasMore: boolean}>>({
    cors: true,
    region,
    secrets: [serviceAccountSecretKey],
}, async ({ data: { limit, lastDocCreationDateMillis }, auth }) => {
    if (!(auth && auth.uid)) {
        throw new HttpsError('unauthenticated', 'User is not signed in');
    }

    const newsPortalServiceAccount = process.env[serviceAccountSecretKey];

    const newsArticleCollRef = newsPortalDb(newsPortalServiceAccount)
        .collection('news')
        .withConverter(converter());

    const query = newsArticleCollRef
        .orderBy('creationDate' as _Paths<_NewsArticle>, 'desc')
        .limit(limit + 1);// +1 item for hasMore

    const queryResult = await (lastDocCreationDateMillis
        ? query.startAfter(Timestamp.fromMillis(lastDocCreationDateMillis))
        : query)
        .get();

    const hasMore = queryResult.size > limit;
    const docsWithoutImage = queryResult.docs.map(doc => doc.data());

    if (hasMore) {
        docsWithoutImage.pop();// remove last doc because queried for +1 doc for hasMore
    }

    const docs: _NewsArticleDto[] = await Promise.all(
        docsWithoutImage.map(({ image, ...doc }) => getImageUrl(newsPortalServiceAccount, image)
            .then(imageUrl => ({
                ...doc,
                imageUrl,
            }))));

    return {
        docs,
        hasMore,
    };
});

type _NewsArticleDtoWithoutImage = Omit<_WebClientDoc<_NewsArticle>, 'creationDate'> & {creationDateMillis: number}
type _NewsArticleDto = Omit<_NewsArticleDtoWithoutImage, 'image'> & {imageUrl: string};
