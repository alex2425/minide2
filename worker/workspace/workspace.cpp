#include "workspace.hpp"

//#####################################################################################################################
std::string WorkspaceInfo::toJson() const
{
    return json{
        {"root", root},
        {"activeProject", activeProject}
    }.dump();
}
//---------------------------------------------------------------------------------------------------------------------
Filesystem::Jail WorkspaceInfo::rootJail() const
{
    return Filesystem::Jail{root};
}
//#####################################################################################################################
