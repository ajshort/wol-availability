import 'react-app-polyfill/ie11';
import 'react-app-polyfill/stable';

import locale from 'date-fns/locale/en-AU';
import React from 'react';
import { registerLocale, setDefaultLocale } from  'react-datepicker';
import ReactDOM from 'react-dom';
import App from './App';
import * as serviceWorker from './serviceWorker';

import 'react-datepicker/dist/react-datepicker.css';
import './index.scss';

// Set the default datepicker locale.
registerLocale('en-AU', locale);
setDefaultLocale('en-AU');

ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
