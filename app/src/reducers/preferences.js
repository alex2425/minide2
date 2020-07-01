import _ from 'lodash'

export default function reducer(state={
    preferences: {}
}, action) {
    switch (action.type) 
    {
        case 'SET_PREFERENCES': 
        {
            return {
                ...state,
                preferences: action.preferences
            }
        }
        default:
            return state;
    }
}