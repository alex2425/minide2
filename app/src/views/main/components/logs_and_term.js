import React from 'react';
import {connect} from 'react-redux';

// Components
/*import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';*/

import TerminalInstance from './terminal';
import LogPanel from './log';
import {TabPanel, SleekTabs} from '../../../elements/tabs';

// Actions
import {setActiveLog} from '../../../actions/log_actions';

// Other
import _ from 'lodash'

// Styles
import './styles/logs_and_term.css';

class LogsAndOthers extends React.Component
{
    panels = {}

    setTermRef = (node) => 
    {
        this.term = node;
    }

    setLogPanel = (panel, key, index) =>
    {
        if (panel === null)
            return;
        this.panels[key] = panel;
        this.panels[key].index = index;
    }
    
    render = () => {
        let tabLabels = this.props.logs.logs.map(log => log.logName);

        return (
            <div className='tabContainer'>
                <SleekTabs
                    onChange={(tabIndex) => this.props.dispatch(setActiveLog(tabIndex))}
                    value={this.props.activeLog}
                    tabLabels={tabLabels}
                    id={this.props.tabsId}
                >
                    {
                        this.props.logs.logs.map((elem, i) => 
                        {
                            if (elem.logType === '_terminal')
                                return (
                                    <TabPanel 
                                        key="__terminalPanel" 
                                        className='terminalPanel'
                                        value={this.props.activeLog}
                                        index={i}
                                    >
                                        <TerminalInstance 
                                            ref={this.setTermRef} 
                                            height={this.props.height}
                                            width={this.props.width}
                                            isVisible={i === this.props.activeLog}
                                        ></TerminalInstance>
                                    </TabPanel>
                                )

                            return (
                                <TabPanel 
                                    key={i} 
                                    index={i}
                                    value={this.props.activeLog}
                                >
                                    <LogPanel 
                                        ref={panel => this.setLogPanel(panel, elem.logName + i, i)} 
                                        data={elem.data}
                                        className='logPanel'
                                        height={this.props.height}
                                        width={this.props.width}
                                        isVisible={i === this.props.activeLog}
                                        onDoubleClick={(x, y, yText) => {
                                            if (elem.logType === 1)
                                            {
                                                const panel = this.panels[elem.logName + i];
                                                if (panel)
                                                {
                                                    this.props.backend.toolbar().logDoubleClick(this.props.activeToolbar, elem.logName, Number(y), yText);
                                                }
                                            }
                                        }}
                                    >
                                    </LogPanel>
                                </TabPanel>
                            );
                        })
                    }
                </SleekTabs>
            </div>
        );
    }
}

export default connect(state => {
    return {
        logs: state.logs,
        activeLog: state.logs.otherLogState.activeLog,
        activeToolbar: state.toolbars.activeToolbar
    }
}, null, null, {forwardRef: true})(LogsAndOthers);