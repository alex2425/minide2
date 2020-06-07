#pragma once

struct Config
{
    int maxStreamListeners = 100;

    /**
     *  Check that the remote_address of a request is the same as the reciepient address for streaming responses.
     **/
    bool streamIdCheck = true;

    long long maxFileReadSize = 1 * 1024 * 1024; // 1 MB max file.
    long long maxFileReadSizeUnforceable = 100 * 1024 * 1024; // 100 MB max forceable file.
    long long fileChunkSize = 10 * 1024;
};