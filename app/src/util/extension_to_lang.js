// For monaco

/**
 * 
 * @param ext The extension to look for
 * @param extraDefinitions extraneous user definitions for file extension mappings
 *  eg: [{ext: '.ligo', lang: 'pascaligo'}]
 */
const extensionToLanguage = (ext, filename, extraDefinitions, guess) =>
{
    if (ext.length === 0)
        return undefined;

    if (filename === 'CMakeLists.txt')
        return 'shell';
    if (filename === 'Makefile')
        return 'shell';
    
    let dotExt;
    if (!ext.startsWith('.'))
    {
        dotExt = '.' + ext;
        ext = ext.substr(1);
    }
    else
        dotExt = ext;

    const isAnyOf = (...args) => 
    {
        return [...args].some(elem => elem === dotExt)
    };

    if (isAnyOf('.cpp', '.cxx', '.tpp', '.txx', '.hpp', '.hxx', '.h', '.c'))
        return 'cpp';
    if (isAnyOf('.cs'))
        return 'csharp';
    if (isAnyOf('.ts', '.tsx'))
        return 'typescript';
    if (isAnyOf('.js', '.jsx'))
        return 'javascript';
    if (isAnyOf('.m', '.mm'))
        return 'objective-c';
    if (isAnyOf('.ps'))
        return 'powershell';
    if (isAnyOf('.md'))
        return 'markdown';
    if (isAnyOf('.mu'))
        return 'markup';
    if (isAnyOf('.yml'))
        return 'yaml';
    if (isAnyOf('.sh', '.gitignore'))
        return 'shell';
    if (isAnyOf('.html'))
        return 'html';
    if (isAnyOf('.json'))
        return 'json';

    // workaround for cmake
    if (isAnyOf('.cmake'))
        return 'shell';

    if (extraDefinitions !== undefined)
    {
        for (let i in extraDefinitions)
        {
            if (ext === extraDefinitions[i].ext)
                return extraDefinitions[i].lang;
        }
    }

    // dont know?
    if (guess === true)
        return ext;
    return undefined;
}

export default extensionToLanguage;