import createHistory from 'history/createBrowserHistory';
import React from 'react';
import { render } from 'react-dom';

import './demo.css';
import Routes from './routes/Routes';

import { config } from './config';

const history = createHistory({
  basename: config.getRouterBasePath()
});

function renderApp(Routes) {
  let rootComponent = (
    <Routes history={history} />
  );

  if (process.env.NODE_ENV !== 'production') {
    const HotLoaderWrapper = require('@artsman/react-hot').HotLoaderWrapper;

    rootComponent = (
      <HotLoaderWrapper>
        {rootComponent}
      </HotLoaderWrapper>
    );
  }

  render(rootComponent, document.getElementById('root'));
}

renderApp(Routes);

if (module.hot) {
  module.hot.accept('./routes/Routes', () => {
    renderApp(require('./routes/Routes'));
  });
}