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

let apiResult; // for storing API calls

const sectionSelect = document.querySelector('#sectionSelect');
const newsList = document.querySelector('.newsList');

(async () => {
    apiResult = await apiClient('/search', { 'api-key': GUARDIAN_API_KEY });
    console.log(apiResult);
    console.log(sectionSelect.value);
    sectionSelect.addEventListener('change', () => {
        while (newsList.lastElementChild) {
            newsList.removeChild(newsList.lastElementChild);
        }
    });
})();
