/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { expect } from "chai";
import sinon from "sinon";
import { ClientInfo } from "../src/ClientInfo";
import { ClientAuthError, AuthError } from "../src";
import { ClientAuthErrorMessage } from "../src/error/ClientAuthError";
import { TEST_DATA_CLIENT_INFO, TEST_CONFIG, TEST_TOKENS } from "./TestConstants";
import { CryptoUtils } from "../src/utils/CryptoUtils";
import { IdToken } from "../src/IdToken";

describe("Client Info", function () {

    describe("getters and setters", function () {

        let clientInfoObj : ClientInfo;
        beforeEach(function () {
            clientInfoObj = new ClientInfo("", TEST_CONFIG.validAuthority);
        });

        afterEach(function () {
            clientInfoObj = null;
        });

        it("for uid", function () {
            expect(clientInfoObj.uid).to.be.empty;
            clientInfoObj.uid = TEST_DATA_CLIENT_INFO.TEST_UID;
            expect(clientInfoObj.uid).to.be.eq(TEST_DATA_CLIENT_INFO.TEST_UID);
        });

        it("for utid", function () {
            expect(clientInfoObj.utid).to.be.empty;
            clientInfoObj.utid = TEST_DATA_CLIENT_INFO.TEST_UTID;
            expect(clientInfoObj.utid).to.be.eq(TEST_DATA_CLIENT_INFO.TEST_UTID);
        });

    });

    describe("createClientInfoFromIdToken", () => {
        it("Returns encoded ClientInfo Object", () => {
            const tempIdToken: IdToken = new IdToken(TEST_TOKENS.IDTOKEN_V2);
            tempIdToken.subject = "test-oid";

            const clientInfo = ClientInfo.createClientInfoFromIdToken(tempIdToken, TEST_CONFIG.validAuthority);

            expect(clientInfo.uid).to.equal("test-oid");
            expect(clientInfo.utid).to.equal("");
        });
    });

    describe("Parsing raw client info string", function () {

        let clientInfoObj : ClientInfo;
        afterEach(function () {
            clientInfoObj = null;
            sinon.restore();
        });

        it("sets uid and utid to empty if null or empty string is passed", function () {
            const nullString : string = null;
            clientInfoObj = new ClientInfo(nullString, TEST_CONFIG.validAuthority);
            expect(clientInfoObj.uid).to.be.empty;
            expect(clientInfoObj.utid).to.be.empty;
            const emptyString = "";
            clientInfoObj = new ClientInfo(emptyString, TEST_CONFIG.validAuthority);
            expect(clientInfoObj.uid).to.be.empty;
            expect(clientInfoObj.utid).to.be.empty;
        });

        it("throws an error if invalid raw string is given", function () {
            const invalidRawString = "youCan'tParseThis";
            let authErr : AuthError;
            try {
                clientInfoObj = new ClientInfo(invalidRawString, TEST_CONFIG.validAuthority);
            } catch (e) {
                authErr = e;
            }

            expect(authErr instanceof ClientAuthError).to.be.true;
            expect(authErr.errorCode).to.equal(ClientAuthErrorMessage.clientInfoDecodingError.code);
            expect(authErr.errorMessage).to.contain(ClientAuthErrorMessage.clientInfoDecodingError.desc);
            expect(authErr.message).to.contain(ClientAuthErrorMessage.clientInfoDecodingError.desc);
            expect(authErr.name).to.equal("ClientAuthError");
            expect(authErr.stack).to.include("ClientInfo.spec.ts");
        });

        it("throws an error if the decoded string is not a valid JSON object.", function () {
            sinon.stub(CryptoUtils, "base64Decode").returns(TEST_DATA_CLIENT_INFO.TEST_INVALID_JSON_CLIENT_INFO);
            let authErr : AuthError;
            try {
                // What we pass in here doesn't matter since we are stubbing
                clientInfoObj = new ClientInfo(TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO, TEST_CONFIG.validAuthority);
            } catch (e) {
                authErr = e;
            }

            expect(authErr instanceof ClientAuthError).to.be.true;
            expect(authErr.errorCode).to.equal(ClientAuthErrorMessage.clientInfoDecodingError.code);
            expect(authErr.errorMessage).to.contain(ClientAuthErrorMessage.clientInfoDecodingError.desc);
            expect(authErr.message).to.contain(ClientAuthErrorMessage.clientInfoDecodingError.desc);
            expect(authErr.name).to.equal("ClientAuthError");
            expect(authErr.stack).to.include("ClientInfo.spec.ts");
        });

        it("correctly sets uid and utid if parsing is done correctly", function () {
            sinon.stub(CryptoUtils, "base64Decode").returns(TEST_DATA_CLIENT_INFO.TEST_DECODED_CLIENT_INFO);
            // What we pass in here doesn't matter since we are stubbing
            clientInfoObj = new ClientInfo(TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO, TEST_CONFIG.validAuthority);
            expect(clientInfoObj).to.not.be.null;
            expect(clientInfoObj.uid).to.be.eq(TEST_DATA_CLIENT_INFO.TEST_UID);
            expect(clientInfoObj.utid).to.be.eq(TEST_DATA_CLIENT_INFO.TEST_UTID);
        });

        it("sets uid and utid if passed authority is null", function () {
            sinon.stub(CryptoUtils, "base64Decode").returns(TEST_DATA_CLIENT_INFO.TEST_DECODED_CLIENT_INFO);
            // What we pass in here doesn't matter since we are stubbing
            clientInfoObj = new ClientInfo(TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO, null);
            expect(clientInfoObj).to.not.be.null;
            expect(clientInfoObj.uid).to.be.eq(TEST_DATA_CLIENT_INFO.TEST_UID);
            expect(clientInfoObj.utid).to.be.eq(TEST_DATA_CLIENT_INFO.TEST_UTID);
        });

        it("sets uid and utid if passed authority is empty string", function () {
            sinon.stub(CryptoUtils, "base64Decode").returns(TEST_DATA_CLIENT_INFO.TEST_DECODED_CLIENT_INFO);
            // What we pass in here doesn't matter since we are stubbing
            clientInfoObj = new ClientInfo(TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO, "");
            expect(clientInfoObj).to.not.be.null;
            expect(clientInfoObj.uid).to.be.eq(TEST_DATA_CLIENT_INFO.TEST_UID);
            expect(clientInfoObj.utid).to.be.eq(TEST_DATA_CLIENT_INFO.TEST_UTID);
        });

        it("sets uid and utid if passed authority is b2c", function () {
            const rawClientInfo = "{\"uid\":\"123-test-uid-testPolicy\",\"utid\":\"456-test-utid\"}";
            sinon.stub(CryptoUtils, "base64Decode").returns(rawClientInfo);
            // What we pass in here doesn't matter since we are stubbing
            clientInfoObj = new ClientInfo(rawClientInfo, "https://b2cdomain.com/b2ctenant.com/testPolicy");
            expect(clientInfoObj).to.not.be.null;
            expect(clientInfoObj.uid).to.be.eq(TEST_DATA_CLIENT_INFO.TEST_UID);
            expect(clientInfoObj.utid).to.be.eq(TEST_DATA_CLIENT_INFO.TEST_UTID);
        });

        it("Does not set anything if uid and utid are not part of clientInfo", () => {
            sinon.stub(CryptoUtils, "base64Decode").returns("{\"test-uid\":\"123-test-uid\",\"test-utid\":\"456-test-utid\"}");
            // What we pass in here doesn't matter since we are stubbing
            clientInfoObj = new ClientInfo(TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO, "");
            expect(clientInfoObj).to.not.be.null;
            expect(clientInfoObj.uid).to.be.eq("");
            expect(clientInfoObj.utid).to.be.eq("");
        });

        it("Does not set utid member if utid not part of ClientInfo", () => {
            sinon.stub(CryptoUtils, "base64Decode").returns("{\"uid\":\"123-test-uid\",\"test-utid\":\"456-test-utid\"}");
            // What we pass in here doesn't matter since we are stubbing
            clientInfoObj = new ClientInfo(TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO, "");
            expect(clientInfoObj).to.not.be.null;
            expect(clientInfoObj.uid).to.be.eq(TEST_DATA_CLIENT_INFO.TEST_UID);
            expect(clientInfoObj.utid).to.be.eq("");

        });

        it("Does not set uid member if uid not part of ClientInfo", () => {
            sinon.stub(CryptoUtils, "base64Decode").returns("{\"test-uid\":\"123-test-uid\",\"utid\":\"456-test-utid\"}");
            // What we pass in here doesn't matter since we are stubbing
            clientInfoObj = new ClientInfo(TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO, "");
            expect(clientInfoObj).to.not.be.null;
            expect(clientInfoObj.uid).to.be.eq("");
            expect(clientInfoObj.utid).to.be.eq(TEST_DATA_CLIENT_INFO.TEST_UTID);
        });

        describe("stripPolicyFromUid", () => {
            it("strips policy from uid", () => {
                expect(ClientInfo.stripPolicyFromUid("test-uid-testPolicy", "https://b2cdomain.com/b2ctenant.com/testPolicy")).to.eq("test-uid");
                expect(ClientInfo.stripPolicyFromUid("test-uid-testPolicy", "https://b2cdomain.com/b2ctenant.com/testPolicy/")).to.eq("test-uid");
            });

            it("returns uid if policy not at end of uid", () => {
                expect(ClientInfo.stripPolicyFromUid("test-uid", "https://login.microsoftonline.com/common")).to.eq("test-uid");
            });

        });
    });

});
