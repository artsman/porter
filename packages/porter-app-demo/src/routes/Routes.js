import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Router } from 'react-router';
import { SplitRoutes } from 'react-router-split-routes';

const SplitLoading = () => (
  <div>Loading...</div>
);

const SplitError = ({ route, className }) => (
  <div>{'Error loading route' + (route ? ': ' + route.path : '')}</div>
);

const RouteError = ({ location, className }) => (
  <div>{(location && location.pathname) ? 'The page ' + location.pathname + ' could not be found' : 'The page you requested could not be found'}</div>
);

const routeOptions = {
  addParamProps: true,
  routeProp: false,
  matchProp: false
};

const routes = [
  {
    path: '/',
    exact: true,
    redirect: '/home'
  },
  {
    path: '/home',
    exact: true,
    componentPath: 'Home',
    props: {
      SplitLoadingComponent: SplitLoading,
      SplitErrorComponent: SplitError
    }
  },
  {
    component: RouteError
  }
];

let loadSplitComponentForPath = () => { };
if (process.env.NODE_ENV === 'production') {
  loadSplitComponentForPath = (containerPath, success, error) => {
    try {
      require('split-chunk-loader?name=route-[name]!./split/' + containerPath)(success, error);
    }
    catch (e) {
      error(e);
    }
  }
}
else {
  loadSplitComponentForPath = (containerPath, success, error) => {
    try {
      success(require('./split/' + containerPath));
    }
    catch (e) {
      error(e);
    }
  }
}

export default class Routes extends Component {

  static propTypes = {
    history: PropTypes.object.isRequired
  };

  render() {
    return (
      <Router history={this.props.history}>
        <SplitRoutes
          routes={routes}
          routeOptions={routeOptions}
          loadSplitComponentForPath={loadSplitComponentForPath}
        />
      </Router>
    );
  }
}
