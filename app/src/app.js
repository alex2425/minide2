import React from 'react';
import MainWindow from './views/main/main_window';
import Environments from './views/environments/environments';
import Preferences from './views/preferences/preferences';
import {BrowserRouter as Router, Route} from 'react-router-dom';
import {Provider} from 'react-redux';
import store from './store';

// styles

class ViewRouter extends React.Component
{
	static Views(store)
	{
		return {
			main: <MainWindow store={store}/>,
			environments: <Environments/>,
			preferences: <Preferences/>
		}
	}

	static View(props)
	{
		let name = props.location.search.substr(1);
		let view = ViewRouter.Views(store)[name];
		if(view == null) 
			throw new Error('View "' + name + '" is undefined');
		return view;
	}

	render() {
		return (
			<Provider store={store}>
				<Router>
					<div>
						<Route path='/' component={ViewRouter.View}/>
					</div>
				</Router>
			</Provider>
		);
	}
}

export default ViewRouter;