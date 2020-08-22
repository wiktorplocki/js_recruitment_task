import './styles/main.css';

const GUARDIAN_API_KEY = '5beb9e2f-11b4-4b39-8b48-67be4429c7e6';
const GUARDIAN_API_URL = 'https://content.guardianapis.com';

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

let savedNewsIndexes = [];

const readLaterList = document.querySelector('.readLaterList');

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
    newsActionsReadLater.addEventListener('click', (event) => {
        const articleNode = event.path.find(
            ({ nodeName }) => nodeName === 'ARTICLE'
        );
        const childrenArray = Array.from(newsList.children);
        const clickedIndex = childrenArray.findIndex((node) =>
            node.textContent.includes(event.target.parentNode.parentNode.textContent)
        );
        savedNewsIndexes.push(clickedIndex);
        articleNode.parentNode.removeChild(articleNode);
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

let apiResult; // for storing API calls

const sectionSelect = document.querySelector('#sectionSelect');
const newsList = document.querySelector('.newsList');

(async () => {
    apiResult = await apiClient('/search', { 'api-key': GUARDIAN_API_KEY });
    console.log(apiResult);
    console.log(sectionSelect.value);
    buildNewsList(apiResult.response.results, newsList);
    sectionSelect.addEventListener('change', () => {
        while (newsList.lastElementChild) {
            newsList.removeChild(newsList.lastElementChild);
        }
    });
})();
