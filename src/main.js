import './styles/main.css';

const GUARDIAN_API_KEY = '5beb9e2f-11b4-4b39-8b48-67be4429c7e6';
const GUARDIAN_API_URL = 'https://content.guardianapis.com';

if (!window.indexedDB) {
    alert(
        'Your browser does not support IndexedDB. You will not be able to store and read stored news items from the Read Later section'
    );
}

const apiClient = async (path, params) => {
    function getQueryStringFromObject(object) {
        return Object.keys(object)
            .map((key) => key + '=' + object[key])
            .join('&');
    }

    if (params) {
        path += '?' + getQueryStringFromObject(params);
    }

    const response = await fetch(`${GUARDIAN_API_URL}/${path}`, {
        method: 'GET', // Hard-coded GET for this task only
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const result = await response.json();
    return result;
};
let apiResult; // for storing API calls

const dbRequest = indexedDB.open('guardianNews');
let db;
dbRequest.onerror = (event) => {
    console.error(
        'ERROR: IndexedDB operation failed, printing the event data below:'
    );
    console.log('Error code:', event.target.errorCode);
    console.log(event);
};
dbRequest.onupgradeneeded = () => {
    db = dbRequest.result;
    if (!db.objectStoreNames.contains('savedNews')) {
        db.createObjectStore('savedNews', { keyPath: 'id' });
    }
};
dbRequest.onsuccess = () => {
    console.log('success');
    db = dbRequest.result;
};

const compareArrays = (current, previous) => {
    if (JSON.stringify(current) === JSON.stringify(previous)) {
        return previous;
    }
    return current;
};

let page = 1;
let section = 'all';
let data = [];
let searchString = '';

const readLaterList = document.querySelector('.readLaterList');
const newsList = document.querySelector('.newsList');
const sectionSelect = document.querySelector('#sectionSelect');
const activePageSelect = document.querySelector('#activePageSelect');
const newsContentSearch = document.querySelector('#newsContentSearch');

newsContentSearch.addEventListener('input', async (event) => {
    searchString = event.target.value;
    while (newsList.lastElementChild) {
        newsList.removeChild(newsList.lastElementChild);
    }

    let options = {
        'api-key': GUARDIAN_API_KEY,
        page,
        q: searchString,
    };
    if (section !== 'all') {
        options = {
            ...options,
            section,
        };
    }
    if (!searchString || searchString === '') {
    // eslint-disable-next-line no-unused-vars
        const { q, ...rest } = options;
        options = rest;
    }
    apiResult = await apiClient('/search', options);
    data = compareArrays(apiResult.response.results, data);
    buildNewsList(data, newsList);
});

activePageSelect.addEventListener('change', async (event) => {
    page = event.target.value;
    while (newsList.lastElementChild) {
        newsList.removeChild(newsList.lastElementChild);
    }

    let options = {
        'api-key': GUARDIAN_API_KEY,
        page,
    };
    if (section !== 'all') {
        options = {
            ...options,
            section,
        };
    }
    apiResult = await apiClient('/search', options);
    data = compareArrays(apiResult.response.results, data);
    buildNewsList(data, newsList);
});

sectionSelect.addEventListener('change', async (event) => {
    while (newsList.lastElementChild) {
        newsList.removeChild(newsList.lastElementChild);
    }

    let options = {
        'api-key': GUARDIAN_API_KEY,
        page,
    };
    section = event.target.value;
    if (event.target.value !== 'all') {
        options = {
            ...options,
            section,
        };
    }
    apiResult = await apiClient('/search', options);
    data = compareArrays(apiResult.response.results, data);
    buildNewsList(data, newsList);
});

const buildSavedNews = (item, parentNode) => {
    const savedNewsLiEl = document.createElement('li');
    const savedNewsTitleEl = document.createElement('h4');
    savedNewsTitleEl.setAttribute('class', 'readLaterItem-title');
    savedNewsTitleEl.innerText = item.webTitle;

    const savedNewsActionsSectionEl = document.createElement('section');

    const savedNewsActionsLink = document.createElement('a');
    savedNewsActionsLink.setAttribute('href', item.webUrl);
    savedNewsActionsLink.setAttribute('class', 'button button-clear');
    savedNewsActionsLink.innerText = 'Read';

    const savedNewsActionsRemove = document.createElement('button');
    savedNewsActionsRemove.setAttribute('class', 'button button-clear');
    savedNewsActionsRemove.innerText = 'Remove';
    savedNewsActionsRemove.addEventListener('click', (event) => {
        let objectStore = db
            .transaction('savedNews', 'readwrite')
            .objectStore('savedNews');
        let deleteRequest = objectStore.delete(item.id);
        deleteRequest.onsuccess = () => console.log('Gone!');
        deleteRequest.onerror = (event) => console.log(event.target);
        const liNode = event.path.find(({ nodeName }) => nodeName === 'LI');
        liNode.parentNode.removeChild(liNode);
    });

    savedNewsActionsSectionEl.append(
        savedNewsActionsLink,
        savedNewsActionsRemove
    );
    savedNewsLiEl.append(savedNewsTitleEl, savedNewsActionsSectionEl);
    parentNode.appendChild(savedNewsLiEl);
};

const buildNewsDetailsSection = (item, parentNode) => {
    const newsDetailsSectionEl = document.createElement('section');
    newsDetailsSectionEl.setAttribute('class', 'newsDetails');

    const newsDetailsUl = document.createElement('ul');
    const newsDetailsLiName = document.createElement('li');
    const newsDetailsLiDate = document.createElement('li');

    const newsDetailsLiNameStrong = document.createElement('strong');
    newsDetailsLiNameStrong.innerText = 'Section Name: ';
    newsDetailsLiName.append(newsDetailsLiNameStrong, item.sectionName);

    const newsDetailsLiDateStrong = document.createElement('strong');
    newsDetailsLiDateStrong.innerText = 'Publication Date: ';
    newsDetailsLiDate.append(
        newsDetailsLiDateStrong,
        new Date(item.webPublicationDate).toDateString()
    );

    newsDetailsUl.append(newsDetailsLiName, newsDetailsLiDate);
    newsDetailsSectionEl.appendChild(newsDetailsUl);
    parentNode.appendChild(newsDetailsSectionEl);
};

const buildNewsActionsSection = (item, parentNode) => {
    const newsActionsSectionEl = document.createElement('section');
    newsActionsSectionEl.setAttribute('class', 'newsActions');

    const newsActionsLink = document.createElement('a');
    newsActionsLink.setAttribute('href', item.webUrl);
    newsActionsLink.setAttribute('class', 'button');
    newsActionsLink.innerText = 'Full article';

    const newsActionsReadLater = document.createElement('button');
    newsActionsReadLater.setAttribute('class', 'button button-outline');
    newsActionsReadLater.innerText = 'Read Later';
    newsActionsReadLater.addEventListener('click', () => {
        let objectStore = db
            .transaction('savedNews', 'readwrite')
            .objectStore('savedNews');
        const { id, webTitle, webUrl } = item;
        let addRequest = objectStore.add({ id, webTitle, webUrl });
        addRequest.onsuccess = () => console.log('Added!', addRequest.result);
        addRequest.onerror = (event) => console.log(event.target.errorCode);
        buildSavedNews(item, readLaterList);
    });

    newsActionsSectionEl.append(newsActionsLink, newsActionsReadLater);
    parentNode.appendChild(newsActionsSectionEl);
};

const buildNewsArticle = (item, parentNode) => {
    const articleEl = document.createElement('article');
    articleEl.setAttribute('class', 'news');

    const headerEl = document.createElement('header');
    const headerH3El = document.createElement('h3');
    headerH3El.innerText = item.webTitle;

    headerEl.appendChild(headerH3El);
    articleEl.appendChild(headerEl);

    buildNewsDetailsSection(item, articleEl);
    buildNewsActionsSection(item, articleEl);
    parentNode.appendChild(articleEl);
};

const buildNewsList = (data = [], parentNode) => {
    data.forEach((item) => {
        const listItemEl = document.createElement('li');
        buildNewsArticle(item, listItemEl);
        parentNode.appendChild(listItemEl);
    });
};

(async () => {
    apiResult = await apiClient('/search', { 'api-key': GUARDIAN_API_KEY });
    let objectStore = db.transaction('savedNews').objectStore('savedNews');
    let savedNews = objectStore.getAll();
    savedNews.onsuccess = () =>
        savedNews.result.map((item) => buildSavedNews(item, readLaterList));
    newsList.removeChild(newsList.firstElementChild);
    readLaterList.removeChild(readLaterList.firstElementChild);
    data = apiResult.response.results;
    buildNewsList(data, newsList);
})();
