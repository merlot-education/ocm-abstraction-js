/*
 *  Copyright 2023-2024 Dataport AöR
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

/**
 * Makes a GET request to the specified URL.
 * @param {string} url - The URL to make the request to.
 * @returns {Promise<Object>} - A promise that resolves to the parsed JSON response.
 */
async function getRequest(url = '') {
    // Default options are marked with *
    const response = await fetch(url, {
        method: 'GET', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
        redirect: 'follow', // manual, *follow, error
        referrerPolicy: 'no-referrer' // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    });

    return response.json(); // parses JSON response into native JavaScript objects
}

/**
 * Sends a POST request to the specified URL with the provided data.
 * @param {string} url - The URL to send the request to.
 * @param {Object} data - The data to include in the request body.
 * @returns {Promise<Object>} - A promise that resolves to the parsed JSON response.
 *
 * source: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
 */
async function postRequest(url = '', data = {}) {
    // Default options are marked with *
    const response = await fetch(url, {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
        headers: {
            'Content-Type': 'application/json'
            // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        redirect: 'follow', // manual, *follow, error
        referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
        body: JSON.stringify(data) // body data type must match "Content-Type" header
    });

    return response.json(); // parses JSON response into native JavaScript objects
}

/**
 * Creates an invitation using the specified URL.
 * @param {string} [url='http://<YOUR OCM IP OR DOMAIN>/v1/invitation-url?alias=trust'] - The URL to use for creating the invitation.
 * @returns {Promise<{invitationUrl: string, connectionId: string}>} - The created invitation URL and connection ID.
 */
async function createInvitation(
    url = 'http://<YOUR OCM IP OR DOMAIN>/v1/invitation-url?alias=trust'
) {
    let response = await postRequest(url);

    return {
        invitationUrl: response.data.invitationUrl,
        connectionId: response.data.connection.id
    };
}

/**
 * Retrieves the connection status for a given connection ID.
 * @param {string} connectionId - The ID of the connection.
 * @param {string} [url='http://<YOUR OCM IP OR DOMAIN>/v1/connections/'] - The URL to make the request to.
 * @returns {Promise<string>} - A promise that resolves to the connection status.
 */
async function getConnectionStatus(
    connectionId,
    url = 'http://<YOUR OCM IP OR DOMAIN>/v1/connections/'
) {
    let response = await getRequest(`${url}${connectionId}`);

    return response.data.records.status;
}

/**
 * Creates a credential offer.
 * @param {string} connectionId - The ID of the connection.
 * @param {object[]} attributes - The attributes to include in the credential.
 * @param {string} [credentialDefinitionId='<YOUR CREDENTIAL DEFINITION ID>'] - The credential definition ID.
 * @param {string} [url='http://<YOUR OCM IP OR DOMAIN>/v1/create-offer-credential'] - The URL to send the request to.
 * @returns {Promise<string>} The ID of the created credential offer.
 */
async function createCredentialOffer(
    connectionId,
    attributes,
    credentialDefinitionId = '<YOUR CREDENTIAL DEFINITION ID>',
    url = 'http://<YOUR OCM IP OR DOMAIN>/v1/create-offer-credential'
) {
    let response = await postRequest(url, {
        connectionId: connectionId,
        credentialDefinitionId,
        comment: '',
        attributes,
        autoAcceptCredential: 'always'
    });

    return response.data.id;
}

/**
 * Retrieves the state of a credential from the specified URL.
 * @param {string} credentialId - The ID of the credential.
 * @param {string} [url='http://<YOUR OCM IP OR DOMAIN>/v1/credential/'] - The URL to retrieve the credential state from.
 * @returns {Promise<string>} - A promise that resolves with the state of the credential
 */
async function getCredentialState(
    credentialId,
    url = 'http://<YOUR OCM IP OR DOMAIN>/v1/credential/'
) {
    let response = await getRequest(`${url}${credentialId}`);

    return response.data.state;
}

/**
 * Waits for the specified number of milliseconds.
 * @param {number} ms - The number of milliseconds to wait.
 * @returns {Promise<void>} - A promise that resolves after the specified number of milliseconds.
 */
async function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function tests() {
    // create the invitation and print the invitation url to the console, copy
    // this string into your wallet or convert it to a QR code and scan that
    invitationObject = await createInvitation();
    console.log(
        `create a QR code from this and scan it with the PCM: ${invitationObject.invitationUrl}`
    );

    // give the user some time to copy the url
    await wait(5000);

    // wait until the connection has been established (status == 'trusted') the
    // user has to accept the connection in their wallet
    while (true) {
        await wait(2500);
        let connectionStatus = await getConnectionStatus(
            invitationObject.connectionId
        );
        console.log(connectionStatus);
        if (connectionStatus == 'trusted') {
            break;
        }
    }

    // define the attributes for the credential, note that these are dependent
    // on the credentialDefinitionId
    let attributes = [
        {
            name: 'user_id',
            value: 'testuser@merlot-education.eu'
        },
        {
            name: 'course_name',
            value: 'Example Course'
        },
        {
            name: 'grade',
            value: '15/15 - passed'
        },
        {
            name: 'variable_data',
            value: 'whatevs'
        }
    ];

    // create the credential offer, the user will get a notifictaion in their
    // wallet with the option to accept the credential wallet
    let credentialId = await createCredentialOffer(
        invitationObject.connectionId,
        attributes
    );

    // wait for the credential to be delivered to the user's wallet
    while (true) {
        await wait(2500);
        let credentialState = await getCredentialState(credentialId);
        console.log(credentialState);
        if (credentialState == 'done') {
            break;
        }
    }
}

function main() {
    tests();
}

main();
