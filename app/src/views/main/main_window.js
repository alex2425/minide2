import React from 'react';
import {connect} from 'react-redux';

// Components
import Toolbar from './components/toolbar';
//import FileView from './components/file_tree';
import Explorer from './components/explorer';
import SplitterLayout from 'react-splitter-layout';
import Editor from './components/editor';
import LogsAndOthers from './components/logs_and_term';
import MessageBox from '../../elements/message_box';
import Blocker from './components/toolbar_blocker';
import Slide from 'react-reveal/Slide';

// Actions
import {setFileTreeBranch} from '../../actions/workspace_actions';
import {addOpenFileWithContent, activeFileWasSynchronized, fileWasSynchronized} from '../../actions/open_file_actions';
import {setConnected, setConnectMessage, setTryingToConnect, setSessionId, setBackendPort, setBackendIp} from '../../actions/backend_actions';
import {initializeToolbars} from '../../actions/toolbar_actions';
import {addToLog, clearLog, focusLogByName} from '../../actions/log_actions.js';
import {setPreferences} from '../../actions/preferences_actions.js';

// Other
import Backend from '../../backend_connector';
import _ from 'lodash';
import Dictionary from '../../util/localization';
import LocalPersistence from '../../util/persistence';

// Style
import './styles/main.css'

// requires
const {ipcRenderer} = window.require('electron');
const Classes = window.require('extends-classes');

class CommonToolbarEvents 
{
    onSave = () => {
        console.log('save')
    }
    onSaveAll = () => {
        console.log('save all')        
    }
}

class CppDebugToolbarEvents 
{
    onDebug = () => {
        console.log('on debug')
    }
    onNextLine = () => {
        console.log('next line')
    }
    onStepInto = () => {
        console.log('step in')
    }
    onStepOut = () => {
        console.log('step out')
    }
}

class CMakeToolbarEvents extends Classes(CommonToolbarEvents, CppDebugToolbarEvents)
{
    onBuild = () => {
        console.log('build')
    }
    onBuildRun = () => {
        console.log('build_run')
    }
    onCancel = () => {
        console.log('cancel')
    }
    onRun = () => {
        console.log('run')
    }
    onCmake = () => {
        console.log('cmake')
    }
}

/**
 * Main Window
 */
class MainWindow extends React.Component 
{
    state = 
    {
        monacoOptions: 
        {
            theme: 'vs-dark',
            options: {}
        },
        yesNoBoxVisible: false,
        yesNoMessage: '',
        okBoxVisible: false,
        okBoxMessage: '',
        logsHeight: 200
    }

    isShortcut(event, shortcutDefinition)
    {
        if (shortcutDefinition === undefined)
            console.error('oups, shortcut is not defined?! look at shortcut store');

        if (event.type !== 'keyup')
            return;

        let is = true;
        _.forIn(shortcutDefinition, (v, k) => 
        {
            if (k === 'key')
            {
                if (event[k].toLowerCase() !== v)
                {
                    is = false;
                    return false;
                }
            }
            else if (event[k] !== v)
            {
                is = false;
                return false;
            }
        });
        return is;
    }

    /**
     * Handles all pressed window-wide shortcuts
     */
    installSaveShortcuts()
    {
        window.addEventListener('keyup', (event) => 
        {
            if (this.isShortcut(event, this.props.shortcuts.bindings.save))
            {
                if (this.props.activeFile >= 0) 
                {
                    let file = this.props.openFiles[this.props.activeFile];
                    this.backend.workspace().saveFile(file.path, file.content, () => 
                    {
                        this.props.dispatch(activeFileWasSynchronized());
                    });
                }
                else
                    console.log('no open file');
                return;
            }

            if (this.isShortcut(event, this.props.shortcuts.bindings.saveAll))
            {
                this.props.openFiles.map(file => 
                {
                    console.log(file);
                    if (!file.synchronized)
                    {
                        this.backend.workspace().saveFile(file.path, file.content, () => 
                        {
                            this.props.dispatch(fileWasSynchronized(file.path));
                        });
                    }
                    return file;
                })
            }
        }, true);
    }

    handleTreeUpdates(head, data)
    {
        if (head.tree.flat === true) 
        {
            console.log(head.origin);
            this.props.dispatch(setFileTreeBranch(head.origin, head.tree.files, head.tree.directories));
        }
    }

    onDataStream(head, data)
    {
        try
        {
            if (head.type === undefined || head.type === null) 
            {
                console.error("backend didn't send a message type. notify this to the backend dev");
                return;
            }

            if (head.type === "file_tree") 
            {
                this.handleTreeUpdates(head, data);
                return;
            }

            if (head.type === "file_content") 
            {
                let data = '';
                if (head.chunks !== undefined)
                    data = head.chunks.join();
                this.props.dispatch(addOpenFileWithContent(head.path, data));
                return;
            }

            if (head.type === "welcome")
            {
                this.props.dispatch(setConnected(true));
                this.backend.toolbar().loadAll(res => {
                    res.json().then(json => {
                        this.initToolbars(json);
                    })
                });
                if (this.props.preferences.backend.autoLoadWorkspace === true)
                {
                    const wspace = this.persistence.getLastWorspace(this.currentHost())
                    if (wspace !== undefined && wspace !== null && wspace !== '')
                    {
                        this.backend.workspace().openWorkspace(wspace);
                    }
                }
            }
        }
        catch(e)
        {
            console.error(e);
        }
    }

    initToolbars = (json) =>
    {
        this.props.dispatch(initializeToolbars(json));
        if (this.toolbar)
            this.toolbar.preselectToolbar();
    }

    showProjectSettigns({settingsFile})
    {
        if (this.props.activeProject === undefined || this.props.activeProject === null || this.props.activeProject === '')
            return this.showOkBox(this.dict.translate("$NoActiveProject", "dialog"));
        if (this.props.workspaceRoot === undefined || this.props.workspaceRoot === null || this.props.workspaceRoot === '')
            return;

        console.log(this.props.activeProject + "/.minIDE/" + settingsFile)
        this.backend.workspace().loadFile(this.props.activeProject + "/.minIDE/" + settingsFile, "projectSettings");
    }

    handleLuaRpc(func, data)
    {
        console.log(data);
        switch (func)
        {
            case('showProjectSettings'):
                return this.showProjectSettigns(data);
            case('setComboboxData'):
                return this.toolbar.comboboxLoaded
                (
                    data.toolbarId,
                    data.itemId,
                    data.targets
                )
            default:
                return;
        }
    }

    onControlStream(head, data)
    {
        try
        {
            if (head.type === "welcome")
                ipcRenderer.sendSync('haveCookieUpdate', {});
            else if (head.type === "keep_alive")
            {}
            else if (head.type === "lua_rpc")
            {
                this.handleLuaRpc(head.functionName, JSON.parse(head.data))
            }
            else if (head.type === "lua_process")
            {
                if (head.message === "\x1b[2J")
                {
                    this.props.dispatch(clearLog(head.processName));
                    this.props.dispatch(focusLogByName(head.processName));
                }
                else
                    this.props.dispatch(addToLog(head.processName, head.message));
            }
            else if (head.type === "lua_process_info")
            {
                const info = JSON.parse(head.data);
                if (info.what === "processEnded")
                {
                    let message = head.processName + " " + this.dict.translate("$ProcessEnded", "lua") + " " + info.status + "\n";
                    this.props.dispatch(addToLog(head.processName, message));
                }
                else if (info.what === "processStartFailure")
                {
                    let message = head.processName + " " + this.dict.translate("$ProcessStartFail", "lua") + " " + info.error + "\n";
                    this.props.dispatch(addToLog(head.processName, message));
                    if (info.error === 2)
                        this.props.dispatch(addToLog(head.processName, this.dict.translate("$ProcessNotFound", "lua") + "\n"));
                    if (info.command !== undefined)
                        this.props.dispatch(addToLog(head.processName, info.command));
                }
            }
            else
            {
                // Unhandled:
                console.log(head);
            }
        }
        catch(e)
        {
            console.error(e);
        }
    }

    onStreamError(err)
    {
        console.error(err);
    }

    constructor(props) 
    {
        super(props)
        this.dict = new Dictionary();
        this.dict.setLang(this.props.locale.language);

        this.registerIpcHandler();
        this.installSaveShortcuts();

        this.props.dispatch(setConnectMessage(this.dict.translate("$ConnectingToBackend", "main_window")));

        this.backend = new Backend
        (
            props.store, 
            // Control Callback
            (...args) => {this.onControlStream(...args);}, 
            // Data Callback
            (...args) => {this.onDataStream(...args);}, 
            // Error Callback
            (...args) => {this.onStreamError(...args);},
            // on Connection Loss
            (...args) => {this.onConnectionLoss(...args);}
        );
        this.throttledHeightUpdate = _.throttle((h) => {
            this.setState({logsHeight: h});
            if (this.term)
                this.term.refit()
        }, 100)
    }

    onConnectionLoss(which)
    {
        if (which === "control_error" || which === "data_error")
            this.props.dispatch(setConnectMessage(this.dict.translate("$ConnectionFailed", "main_window")))
        else
            this.props.dispatch(setConnectMessage(this.dict.translate("$ConnectionLost", "main_window")))
        this.props.dispatch(setConnected(false));
        this.props.dispatch(setTryingToConnect(false));
    }

    currentHost = () => 
    {
        return {
            host: this.props.backend.ip,
            port: this.props.backend.port
        };
    }

    registerIpcHandler = () => 
    {
        ipcRenderer.on('openWorkspace', (event, arg) => 
        {
            if (arg.canceled)
                return;
            this.backend.workspace().openWorkspace(arg.filePaths[0]);
            this.persistence.setLastWorkspace(this.currentHost(), arg.filePaths[0]);
        })

        ipcRenderer.on('setHome', (event, arg) => {
            this.home = arg

            this.persistence = new LocalPersistence(this.home, window.require('fs'));
            try
            {
                this.persistence.load();
            }
            catch(e)
            {
                try
                {
                    this.persistence.save();
                }
                catch(e)
                {}
            }
        })

        ipcRenderer.on('preferences', (event, arg) => {
            this.props.dispatch(setPreferences(arg));
        })

        ipcRenderer.on('setBackend', (event, arg) =>
        {
            this.props.dispatch(setBackendIp(arg.ip));
            this.props.dispatch(setBackendPort(arg.port));
            if (arg.autoConnect && this.props.backend.connected === false)
                this.backend.authenticate(() => {this.backend.readControl()});
        })

        ipcRenderer.on('connectBackend', (event, arg) => 
        {
            this.backend.readControl();
            this.props.dispatch(setTryingToConnect(true));
        })
        
        ipcRenderer.on('testBackend', (event, arg) => 
        {
            this.backend.workspace().openWorkspace("D:/Development/IDE2/test-project");
        })

        ipcRenderer.on('reloadToolbar', (event, arg) => 
        {
            this.backend.toolbar().loadAll(res => {
                res.json().then(json => {
                    this.initToolbars(json);
                })
            });
        })
        
        ipcRenderer.on('closeIssued', (event, arg) => 
        {
            // any unchanged files?
            let anyFound = false;
            for (let i in this.props.openFiles)
            {
                const file = this.props.openFiles[i];
                if (!file.synchronized)
                {
                    this.showYesNoBox(this.dict.translate('$CloseWithUnsavedChanges', 'dialog'), () => {
                        ipcRenderer.sendSync('closeNow', '');
                    })
                    anyFound = true;
                    break;
                }
            }
            if (!anyFound)
                ipcRenderer.sendSync('closeNow', '');
        })

        ipcRenderer.on('cookie', (event, arg) => {
            if (arg.name === 'aSID')
            {
                this.props.dispatch(setSessionId(arg.value));
                this.backend.readData();
            }
        })
    }

    showYesNoBox(message, yesAction) 
    {
        this.setState({
            yesNoBoxVisible: true,
            yesNoMessage: message
        })
        this.yesAction = yesAction;
    }

    showOkBox(message, okAction) 
    {
        this.setState({
            okBoxVisible: true,
            okBoxMessage: message
        })
        this.okAction = okAction;
    }

    onMessageBoxClose(whatButton)
    {
        this.setState({
            yesNoBoxVisible: false
        });
        if (whatButton === "Yes" && this.okAction)
            this.yesAction();
    }

    onOkBoxClose(whatButton)
    {
        this.setState({
            okBoxVisible: false
        });
        if (whatButton === "Ok" && this.okAction)
            this.okAction();
    }

    componentDidMount()
    {
    }

    setToolbarRef = (node) => 
    {
        this.toolbar = node;
    }

    render = () => 
    {
        return (
            <div id='Content'>
                <div id='BlockerOrToolbar'>
                    <Slide left when={!this.props.backend.connected}>
                        <Blocker></Blocker>
                    </Slide>
                    <Slide right when={this.props.backend.connected}>
                        <Toolbar dict={this.dict} ref={(n) => {this.setToolbarRef(n)}} backend={this.backend} cmake={new CMakeToolbarEvents()}/>
                    </Slide>
                </div>
                <div id='SplitterContainer'>
                    <SplitterLayout vertical={false} percentage={true} secondaryInitialSize={60}>
                        <div>
                            <Explorer persistence={this.persistence} dict={this.dict} backend={this.backend}/>
                        </div>
                        <div id='RightOfExplorer'>
                            <SplitterLayout 
                                vertical={true} 
                                secondaryInitialSize={250}
                                onSecondaryPaneSizeChange={p => {this.throttledHeightUpdate(p)}}
                            >
                                <Editor dict={this.dict} className='Editor' monacoOptions={this.state.monacoOptions}></Editor>
                                <LogsAndOthers 
                                    dict={this.dict} 
                                    height={this.state.logsHeight} 
                                    className="logsAndOthers"
                                    onTermRef={term => {
                                        this.term = term;
                                    }}
                                ></LogsAndOthers>
                            </SplitterLayout>
                        </div>
                    </SplitterLayout>
                </div>
                <MessageBox boxStyle="YesNo" dict={this.dict} visible={this.state.yesNoBoxVisible} message={this.state.yesNoMessage} onButtonPress={(wb)=>{this.onMessageBoxClose(wb);}}/>
                <MessageBox boxStyle="Ok" dict={this.dict} visible={this.state.okBoxVisible} message={this.state.okBoxMessage} onButtonPress={(wb)=>{this.onOkBoxClose(wb);}}/>
            </div>
        )
    }
}

export default connect(state => {
    return {
        openFiles: state.openFiles.openFiles,
        activeFile: state.openFiles.activeFile,
        shortcuts: state.shortcuts,
        locale: state.locale,
        backend: state.backend,
        activeProject: state.workspace.activeProject,
        workspaceRoot: state.workspace.root,
        preferences: state.preferences.preferences
    }
})(MainWindow);