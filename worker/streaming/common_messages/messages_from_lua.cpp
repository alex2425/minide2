#include "messages_from_lua.hpp"

using namespace std::string_literals;

namespace Streaming::Messages
{
//#####################################################################################################################
    std::string LuaInfoMessage::toJson() const
    {
        return json{
            {"type", "lua_info"s},
            {"message", message},
            {"data", formattedData}
        }.dump();
    }
//#####################################################################################################################
    std::string LuaErrorMessage::toJson() const
    {
        return json{
            {"type", "lua_warn"s},
            {"message", message},
            {"data", formattedData},
            {"stage", static_cast <int> (type)}
        }.dump();
    }
//#####################################################################################################################
    std::string LuaWarningMessage::toJson() const
    {
        return json{
            {"type", "lua_error"s},
            {"message", message},
            {"data", formattedData}
        }.dump();
    }
//#####################################################################################################################
    std::string LuaProcessOutputMessage::toJson() const
    {
        return json{
            {"type", "lua_process"s},
            {"isStdErr", stdErr},
            {"programName", programName},
            {"message", message},
            {"kind", static_cast <int> (type)}
        }.dump();
    }
//#####################################################################################################################
}