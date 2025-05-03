package com.defi.contracts;

import io.reactivex.Flowable;
import java.math.BigInteger;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.Callable;
import org.web3j.abi.EventEncoder;
import org.web3j.abi.TypeReference;
import org.web3j.abi.datatypes.Address;
import org.web3j.abi.datatypes.Bool;
import org.web3j.abi.datatypes.Event;
import org.web3j.abi.datatypes.Function;
import org.web3j.abi.datatypes.Type;
import org.web3j.abi.datatypes.generated.Uint256;
import org.web3j.crypto.Credentials;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.DefaultBlockParameter;
import org.web3j.protocol.core.RemoteFunctionCall;
import org.web3j.protocol.core.methods.request.EthFilter;
import org.web3j.protocol.core.methods.response.BaseEventResponse;
import org.web3j.protocol.core.methods.response.Log;
import org.web3j.protocol.core.methods.response.TransactionReceipt;
import org.web3j.tuples.generated.Tuple6;
import org.web3j.tx.Contract;
import org.web3j.tx.TransactionManager;
import org.web3j.tx.gas.ContractGasProvider;

/**
 * <p>Auto generated code.
 * <p><strong>Do not modify!</strong>
 * <p>Please use the <a href="https://docs.web3j.io/command_line.html">web3j command line tools</a>,
 * or the org.web3j.codegen.SolidityFunctionWrapperGenerator in the 
 * <a href="https://github.com/web3j/web3j/tree/master/codegen">codegen module</a> to update.
 *
 * <p>Generated with web3j version 4.10.0.
 */
@SuppressWarnings("rawtypes")
public class LendingPool extends Contract {
    public static final String BINARY = "Bin file was not provided";

    public static final String FUNC_ASSETTOKEN = "assetToken";

    public static final String FUNC_BORROW = "borrow";

    public static final String FUNC_INTERESTRATE = "interestRate";

    public static final String FUNC_LIQUIDATE = "liquidate";

    public static final String FUNC_LIQUIDATIONTHRESHOLD = "liquidationThreshold";

    public static final String FUNC_LOANIDCOUNTER = "loanIdCounter";

    public static final String FUNC_LOANTERM = "loanTerm";

    public static final String FUNC_LOANS = "loans";

    public static final String FUNC_REPAY = "repay";

    public static final String FUNC_STABLECOIN = "stablecoin";

    public static final String FUNC_TOKENTOLOANID = "tokenToLoanId";

    public static final String FUNC_UPDATEINTERESTRATE = "updateInterestRate";

    public static final Event LOANCREATED_EVENT = new Event("LoanCreated", 
            Arrays.<TypeReference<?>>asList(new TypeReference<Uint256>() {}, new TypeReference<Uint256>() {}, new TypeReference<Uint256>() {}));
    ;

    public static final Event LOANLIQUIDATED_EVENT = new Event("LoanLiquidated", 
            Arrays.<TypeReference<?>>asList(new TypeReference<Uint256>() {}));
    ;

    public static final Event LOANREPAID_EVENT = new Event("LoanRepaid", 
            Arrays.<TypeReference<?>>asList(new TypeReference<Uint256>() {}, new TypeReference<Uint256>() {}));
    ;

    @Deprecated
    protected LendingPool(String contractAddress, Web3j web3j, Credentials credentials, BigInteger gasPrice, BigInteger gasLimit) {
        super(BINARY, contractAddress, web3j, credentials, gasPrice, gasLimit);
    }

    protected LendingPool(String contractAddress, Web3j web3j, Credentials credentials, ContractGasProvider contractGasProvider) {
        super(BINARY, contractAddress, web3j, credentials, contractGasProvider);
    }

    @Deprecated
    protected LendingPool(String contractAddress, Web3j web3j, TransactionManager transactionManager, BigInteger gasPrice, BigInteger gasLimit) {
        super(BINARY, contractAddress, web3j, transactionManager, gasPrice, gasLimit);
    }

    protected LendingPool(String contractAddress, Web3j web3j, TransactionManager transactionManager, ContractGasProvider contractGasProvider) {
        super(BINARY, contractAddress, web3j, transactionManager, contractGasProvider);
    }

    public static List<LoanCreatedEventResponse> getLoanCreatedEvents(TransactionReceipt transactionReceipt) {
        List<Contract.EventValuesWithLog> valueList = staticExtractEventParametersWithLog(LOANCREATED_EVENT, transactionReceipt);
        ArrayList<LoanCreatedEventResponse> responses = new ArrayList<LoanCreatedEventResponse>(valueList.size());
        for (Contract.EventValuesWithLog eventValues : valueList) {
            LoanCreatedEventResponse typedResponse = new LoanCreatedEventResponse();
            typedResponse.log = eventValues.getLog();
            typedResponse.loanId = (BigInteger) eventValues.getNonIndexedValues().get(0).getValue();
            typedResponse.tokenId = (BigInteger) eventValues.getNonIndexedValues().get(1).getValue();
            typedResponse.amount = (BigInteger) eventValues.getNonIndexedValues().get(2).getValue();
            responses.add(typedResponse);
        }
        return responses;
    }

    public static LoanCreatedEventResponse getLoanCreatedEventFromLog(Log log) {
        Contract.EventValuesWithLog eventValues = staticExtractEventParametersWithLog(LOANCREATED_EVENT, log);
        LoanCreatedEventResponse typedResponse = new LoanCreatedEventResponse();
        typedResponse.log = log;
        typedResponse.loanId = (BigInteger) eventValues.getNonIndexedValues().get(0).getValue();
        typedResponse.tokenId = (BigInteger) eventValues.getNonIndexedValues().get(1).getValue();
        typedResponse.amount = (BigInteger) eventValues.getNonIndexedValues().get(2).getValue();
        return typedResponse;
    }

    public Flowable<LoanCreatedEventResponse> loanCreatedEventFlowable(EthFilter filter) {
        return web3j.ethLogFlowable(filter).map(log -> getLoanCreatedEventFromLog(log));
    }

    public Flowable<LoanCreatedEventResponse> loanCreatedEventFlowable(DefaultBlockParameter startBlock, DefaultBlockParameter endBlock) {
        EthFilter filter = new EthFilter(startBlock, endBlock, getContractAddress());
        filter.addSingleTopic(EventEncoder.encode(LOANCREATED_EVENT));
        return loanCreatedEventFlowable(filter);
    }

    public static List<LoanLiquidatedEventResponse> getLoanLiquidatedEvents(TransactionReceipt transactionReceipt) {
        List<Contract.EventValuesWithLog> valueList = staticExtractEventParametersWithLog(LOANLIQUIDATED_EVENT, transactionReceipt);
        ArrayList<LoanLiquidatedEventResponse> responses = new ArrayList<LoanLiquidatedEventResponse>(valueList.size());
        for (Contract.EventValuesWithLog eventValues : valueList) {
            LoanLiquidatedEventResponse typedResponse = new LoanLiquidatedEventResponse();
            typedResponse.log = eventValues.getLog();
            typedResponse.loanId = (BigInteger) eventValues.getNonIndexedValues().get(0).getValue();
            responses.add(typedResponse);
        }
        return responses;
    }

    public static LoanLiquidatedEventResponse getLoanLiquidatedEventFromLog(Log log) {
        Contract.EventValuesWithLog eventValues = staticExtractEventParametersWithLog(LOANLIQUIDATED_EVENT, log);
        LoanLiquidatedEventResponse typedResponse = new LoanLiquidatedEventResponse();
        typedResponse.log = log;
        typedResponse.loanId = (BigInteger) eventValues.getNonIndexedValues().get(0).getValue();
        return typedResponse;
    }

    public Flowable<LoanLiquidatedEventResponse> loanLiquidatedEventFlowable(EthFilter filter) {
        return web3j.ethLogFlowable(filter).map(log -> getLoanLiquidatedEventFromLog(log));
    }

    public Flowable<LoanLiquidatedEventResponse> loanLiquidatedEventFlowable(DefaultBlockParameter startBlock, DefaultBlockParameter endBlock) {
        EthFilter filter = new EthFilter(startBlock, endBlock, getContractAddress());
        filter.addSingleTopic(EventEncoder.encode(LOANLIQUIDATED_EVENT));
        return loanLiquidatedEventFlowable(filter);
    }

    public static List<LoanRepaidEventResponse> getLoanRepaidEvents(TransactionReceipt transactionReceipt) {
        List<Contract.EventValuesWithLog> valueList = staticExtractEventParametersWithLog(LOANREPAID_EVENT, transactionReceipt);
        ArrayList<LoanRepaidEventResponse> responses = new ArrayList<LoanRepaidEventResponse>(valueList.size());
        for (Contract.EventValuesWithLog eventValues : valueList) {
            LoanRepaidEventResponse typedResponse = new LoanRepaidEventResponse();
            typedResponse.log = eventValues.getLog();
            typedResponse.loanId = (BigInteger) eventValues.getNonIndexedValues().get(0).getValue();
            typedResponse.amount = (BigInteger) eventValues.getNonIndexedValues().get(1).getValue();
            responses.add(typedResponse);
        }
        return responses;
    }

    public static LoanRepaidEventResponse getLoanRepaidEventFromLog(Log log) {
        Contract.EventValuesWithLog eventValues = staticExtractEventParametersWithLog(LOANREPAID_EVENT, log);
        LoanRepaidEventResponse typedResponse = new LoanRepaidEventResponse();
        typedResponse.log = log;
        typedResponse.loanId = (BigInteger) eventValues.getNonIndexedValues().get(0).getValue();
        typedResponse.amount = (BigInteger) eventValues.getNonIndexedValues().get(1).getValue();
        return typedResponse;
    }

    public Flowable<LoanRepaidEventResponse> loanRepaidEventFlowable(EthFilter filter) {
        return web3j.ethLogFlowable(filter).map(log -> getLoanRepaidEventFromLog(log));
    }

    public Flowable<LoanRepaidEventResponse> loanRepaidEventFlowable(DefaultBlockParameter startBlock, DefaultBlockParameter endBlock) {
        EthFilter filter = new EthFilter(startBlock, endBlock, getContractAddress());
        filter.addSingleTopic(EventEncoder.encode(LOANREPAID_EVENT));
        return loanRepaidEventFlowable(filter);
    }

    public RemoteFunctionCall<String> assetToken() {
        final Function function = new Function(FUNC_ASSETTOKEN, 
                Arrays.<Type>asList(), 
                Arrays.<TypeReference<?>>asList(new TypeReference<Address>() {}));
        return executeRemoteCallSingleValueReturn(function, String.class);
    }

    public RemoteFunctionCall<TransactionReceipt> borrow(BigInteger tokenId, BigInteger amount) {
        final Function function = new Function(
                FUNC_BORROW, 
                Arrays.<Type>asList(new org.web3j.abi.datatypes.generated.Uint256(tokenId), 
                new org.web3j.abi.datatypes.generated.Uint256(amount)), 
                Collections.<TypeReference<?>>emptyList());
        return executeRemoteCallTransaction(function);
    }

    public RemoteFunctionCall<BigInteger> interestRate() {
        final Function function = new Function(FUNC_INTERESTRATE, 
                Arrays.<Type>asList(), 
                Arrays.<TypeReference<?>>asList(new TypeReference<Uint256>() {}));
        return executeRemoteCallSingleValueReturn(function, BigInteger.class);
    }

    public RemoteFunctionCall<TransactionReceipt> liquidate(BigInteger loanId) {
        final Function function = new Function(
                FUNC_LIQUIDATE, 
                Arrays.<Type>asList(new org.web3j.abi.datatypes.generated.Uint256(loanId)), 
                Collections.<TypeReference<?>>emptyList());
        return executeRemoteCallTransaction(function);
    }

    public RemoteFunctionCall<BigInteger> liquidationThreshold() {
        final Function function = new Function(FUNC_LIQUIDATIONTHRESHOLD, 
                Arrays.<Type>asList(), 
                Arrays.<TypeReference<?>>asList(new TypeReference<Uint256>() {}));
        return executeRemoteCallSingleValueReturn(function, BigInteger.class);
    }

    public RemoteFunctionCall<BigInteger> loanIdCounter() {
        final Function function = new Function(FUNC_LOANIDCOUNTER, 
                Arrays.<Type>asList(), 
                Arrays.<TypeReference<?>>asList(new TypeReference<Uint256>() {}));
        return executeRemoteCallSingleValueReturn(function, BigInteger.class);
    }

    public RemoteFunctionCall<BigInteger> loanTerm() {
        final Function function = new Function(FUNC_LOANTERM, 
                Arrays.<Type>asList(), 
                Arrays.<TypeReference<?>>asList(new TypeReference<Uint256>() {}));
        return executeRemoteCallSingleValueReturn(function, BigInteger.class);
    }

    public RemoteFunctionCall<Tuple6<BigInteger, BigInteger, BigInteger, BigInteger, BigInteger, Boolean>> loans(BigInteger param0) {
        final Function function = new Function(FUNC_LOANS, 
                Arrays.<Type>asList(new org.web3j.abi.datatypes.generated.Uint256(param0)), 
                Arrays.<TypeReference<?>>asList(new TypeReference<Uint256>() {}, new TypeReference<Uint256>() {}, new TypeReference<Uint256>() {}, new TypeReference<Uint256>() {}, new TypeReference<Uint256>() {}, new TypeReference<Bool>() {}));
        return new RemoteFunctionCall<Tuple6<BigInteger, BigInteger, BigInteger, BigInteger, BigInteger, Boolean>>(function,
                new Callable<Tuple6<BigInteger, BigInteger, BigInteger, BigInteger, BigInteger, Boolean>>() {
                    @Override
                    public Tuple6<BigInteger, BigInteger, BigInteger, BigInteger, BigInteger, Boolean> call() throws Exception {
                        List<Type> results = executeCallMultipleValueReturn(function);
                        return new Tuple6<BigInteger, BigInteger, BigInteger, BigInteger, BigInteger, Boolean>(
                                (BigInteger) results.get(0).getValue(), 
                                (BigInteger) results.get(1).getValue(), 
                                (BigInteger) results.get(2).getValue(), 
                                (BigInteger) results.get(3).getValue(), 
                                (BigInteger) results.get(4).getValue(), 
                                (Boolean) results.get(5).getValue());
                    }
                });
    }

    public RemoteFunctionCall<TransactionReceipt> repay(BigInteger loanId) {
        final Function function = new Function(
                FUNC_REPAY, 
                Arrays.<Type>asList(new org.web3j.abi.datatypes.generated.Uint256(loanId)), 
                Collections.<TypeReference<?>>emptyList());
        return executeRemoteCallTransaction(function);
    }

    public RemoteFunctionCall<String> stablecoin() {
        final Function function = new Function(FUNC_STABLECOIN, 
                Arrays.<Type>asList(), 
                Arrays.<TypeReference<?>>asList(new TypeReference<Address>() {}));
        return executeRemoteCallSingleValueReturn(function, String.class);
    }

    public RemoteFunctionCall<BigInteger> tokenToLoanId(BigInteger param0) {
        final Function function = new Function(FUNC_TOKENTOLOANID, 
                Arrays.<Type>asList(new org.web3j.abi.datatypes.generated.Uint256(param0)), 
                Arrays.<TypeReference<?>>asList(new TypeReference<Uint256>() {}));
        return executeRemoteCallSingleValueReturn(function, BigInteger.class);
    }

    public RemoteFunctionCall<TransactionReceipt> updateInterestRate(BigInteger newRate) {
        final Function function = new Function(
                FUNC_UPDATEINTERESTRATE, 
                Arrays.<Type>asList(new org.web3j.abi.datatypes.generated.Uint256(newRate)), 
                Collections.<TypeReference<?>>emptyList());
        return executeRemoteCallTransaction(function);
    }

    @Deprecated
    public static LendingPool load(String contractAddress, Web3j web3j, Credentials credentials, BigInteger gasPrice, BigInteger gasLimit) {
        return new LendingPool(contractAddress, web3j, credentials, gasPrice, gasLimit);
    }

    @Deprecated
    public static LendingPool load(String contractAddress, Web3j web3j, TransactionManager transactionManager, BigInteger gasPrice, BigInteger gasLimit) {
        return new LendingPool(contractAddress, web3j, transactionManager, gasPrice, gasLimit);
    }

    public static LendingPool load(String contractAddress, Web3j web3j, Credentials credentials, ContractGasProvider contractGasProvider) {
        return new LendingPool(contractAddress, web3j, credentials, contractGasProvider);
    }

    public static LendingPool load(String contractAddress, Web3j web3j, TransactionManager transactionManager, ContractGasProvider contractGasProvider) {
        return new LendingPool(contractAddress, web3j, transactionManager, contractGasProvider);
    }

    public static class LoanCreatedEventResponse extends BaseEventResponse {
        public BigInteger loanId;

        public BigInteger tokenId;

        public BigInteger amount;
    }

    public static class LoanLiquidatedEventResponse extends BaseEventResponse {
        public BigInteger loanId;
    }

    public static class LoanRepaidEventResponse extends BaseEventResponse {
        public BigInteger loanId;

        public BigInteger amount;
    }
}
