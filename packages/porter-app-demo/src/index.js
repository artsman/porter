import { createBrowserHistory } from 'history';
import React from 'react';
import { render } from 'react-dom';

import './demo.css';
import Routes from './routes/Routes';

import { config } from './config';



const history = createBrowserHistory({
  basename: config.getRouterBasePath()
});

function renderApp(Routes) {
  let rootComponent = (
    <Routes history={history} />
  );

  render(rootComponent, document.getElementById('root'));
}

renderApp(Routes);

if (module.hot) {
  module.hot.accept('./routes/Routes', () => {
    renderApp(require('./routes/Routes'));
  });
}