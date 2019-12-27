/* eslint-disable */
import { Address, CheckoutSelectors, Consignment, Country, CustomerAddress, CustomerRequestOptions, FormField, ShippingInitializeOptions, ShippingRequestOptions } from '@bigcommerce/checkout-sdk';
import { withFormik, FormikProps } from 'formik';
import { debounce, noop } from 'lodash';
import React, { PureComponent, ReactNode } from 'react';
import { lazy, object } from 'yup';

import { getAddressValidationSchema, isEqualAddress, mapAddressFromFormValues, mapAddressToFormValues, AddressFormValues } from '../address';
import { withLanguage, WithLanguageProps } from '../locale';

import { LoadingOverlay } from '../ui/loading';
import { Fieldset, Form, RadioInput } from '../ui/form';

import hasSelectedShippingOptions from './hasSelectedShippingOptions';
import BillingSameAsShippingField from './BillingSameAsShippingField';
import ShippingAddress from './ShippingAddress';
import { SHIPPING_ADDRESS_FIELDS } from './ShippingAddressFields';
import ShippingFormFooter from './ShippingFormFooter';
import states from 'us-state-codes';

export interface SingleShippingFormProps {
    addresses: CustomerAddress[];
    cartHasChanged: boolean;
    consignments: Consignment[];
    countries: Country[];
    countriesWithAutocomplete: string[];
    customerMessage: string;
    googleMapsApiKey?: string;
    isLoading: boolean;
    isMultiShippingMode: boolean;
    methodId?: string;
    shippingAddress?: Address;
    shouldShowOrderComments: boolean;
    deinitialize(options: ShippingRequestOptions): Promise<CheckoutSelectors>;
    deleteConsignments(): Promise<Address | undefined>;
    getFields(countryCode?: string): FormField[];
    initialize(options: ShippingInitializeOptions): Promise<CheckoutSelectors>;
    onSubmit(values: SingleShippingFormValues): void;
    onUnhandledError?(error: Error): void;
    signOut(options?: CustomerRequestOptions): void;
    updateAddress(address: Partial<Address>): Promise<CheckoutSelectors>;
    selectedOption?: any;
    shippingSameAsBilling?: any;
    requiredBillingPhoneNumber?: any;
    isDeliveryAdressShow?: any;
    isPickupStoreShow?: any;
    isLoadingAxiosPS?: any;
    storePickupOptionsPS?: any;
}

export interface SingleShippingFormValues {
    billingSameAsShipping: boolean;
    shippingAddress?: AddressFormValues;
    orderComment: string;
}

interface SingleShippingFormState {
    addressPS?: any;
    checkBoxValue?: any;
    checkShippingDiv?: any;
    firstNamePS?: any;
    isResettingAddress: boolean;
    isUpdatingShippingData: boolean;
    lastNamePS?: any;
    selectedOption: boolean;
}

export const SHIPPING_AUTOSAVE_DELAY = 1000;

class SingleShippingForm extends PureComponent<SingleShippingFormProps & WithLanguageProps & FormikProps<SingleShippingFormValues>> {
    state: SingleShippingFormState = {
        isResettingAddress: false,
        isUpdatingShippingData: false,
        selectedOption: false,
        addressPS: {},
        firstNamePS:'',
        lastNamePS:'',
    };

    private debouncedUpdateAddress: any;

    constructor(props: SingleShippingFormProps & WithLanguageProps & FormikProps<SingleShippingFormValues>) {
        super(props);

        const { updateAddress } = this.props;

        this.debouncedUpdateAddress = debounce(async (address: Address) => {
            try {
                await updateAddress(address);
            } finally {
                this.setState({ isUpdatingShippingData: false });
            }
        }, SHIPPING_AUTOSAVE_DELAY);
    }

    render(): ReactNode {
        const {
            addresses,
            cartHasChanged,
            isLoading,
            onUnhandledError,
            methodId,
            countries,
            countriesWithAutocomplete,
            googleMapsApiKey,
            shippingAddress,
            shippingSameAsBilling,
            consignments,
            shouldShowOrderComments,
            initialize,
            isValid,
            deinitialize,
            signOut,
            values: { shippingAddress: addressForm },
        } = this.props;

        const {
            isResettingAddress,
            isUpdatingShippingData,
            checkShippingDiv,
            checkBoxValue,
        } = this.state;
        
        this.setState({ checkShippingDiv: true });

        this.setState({ checkBoxValue: true });

        if(shippingSameAsBilling !== 'off') {
            this.setState({ checkShippingDiv: false });

            if (shippingSameAsBilling === 'never') {
                this.setState({ checkBoxValue: false });
            } else if (shippingSameAsBilling === 'always') {
                this.setState({ checkBoxValue: true });
            }
        }
        
        return (
            <Form autoComplete="on">
                <Fieldset>
                    <ShippingAddress
                        addresses={ addresses }
                        consignments={ consignments }
                        countries={ countries }
                        countriesWithAutocomplete={ countriesWithAutocomplete }
                        deinitialize={ deinitialize }
                        formFields={ this.getFields(addressForm && addressForm.countryCode) }
                        googleMapsApiKey={ googleMapsApiKey }
                        initialize={ initialize }
                        isDeliveryShowAddress={ this.props.isDeliveryAdressShow }
                        isLoading={ isResettingAddress }
                        isPickupStoreShowAddress={ this.props.isPickupStoreShow }
                        methodId={ methodId }
                        onAddressSelect={ this.handleAddressSelect }
                        onFieldChange={ this.handleFieldChange }
                        onUnhandledError={ onUnhandledError }
                        onUseNewAddress={ this.onUseNewAddress }
                        requiredPhoneNumberShipping={ this.props.requiredBillingPhoneNumber }
                        shippingAddress={ shippingAddress }
                        signOut={ signOut }
                    />

                    { this.props.isPickupStoreShow ?  
                        <LoadingOverlay
                            hideContentWhenLoading
                            isLoading={ this.props.isLoadingAxiosPS }
                        >
                        
                        { 
                            this.props.storePickupOptionsPS.map(option => (
                                <div className="pickup-store-address-radio">
                                    <RadioInput
                                        additionalClassName={ 'ps-radio-input' }
                                        checked={ this.state.selectedOption == option.id }
                                        id={ 'store_'+option.id }
                                        label={ <h5>{ option.store_name }</h5> }
                                        name={ 'pickupStoreAddress' }
                                        onChange={ ({ target }) => this.onChangePSoptions(target.value) }
                                        value={ option.id }
                                     />
                                     <div className="address-line-ps">{ option.address_line } </div>
                                     <div className="address-line-ps">{ option.city + ', ' + states.getStateCodeByStateName(option.state) + ', ' + option.zipcode} </div>
                                </div>
                            ))
                        }
                        
                        </LoadingOverlay> 
                        : ""
                    }
                        
                    <div className="form-body">
                        <BillingSameAsShippingField 
                            checkShippingDiv={ checkShippingDiv }
                            checkBoxValue={ checkBoxValue }
                        />
                    </div>
                </Fieldset>

                <ShippingFormFooter
                    cartHasChanged={ cartHasChanged }
                    isLoading={ isLoading || isUpdatingShippingData }
                    isMultiShippingMode={ false }
                    shouldDisableSubmit={ this.shouldDisableSubmit() }
                    shouldShowOrderComments={ shouldShowOrderComments }
                    shouldShowShippingOptions={ isValid }
                />
            </Form>
        );
    }

    

    private onChangePSoptions: () => void = (value) => {
        this.setState({
            selectedOption: value
        });
        let countryPS = "";
        const addressToSetInInputs = this.props.storePickupOptionsPS.find(singleAddress => (singleAddress.id == value));
        const stateAbbr = states.getStateCodeByStateName(addressToSetInInputs.state);

        if (addressToSetInInputs.country == "usa" || addressToSetInInputs.country == "us") {
            countryPS = 'US';
        }

        if (addressToSetInInputs.country == "can" || addressToSetInInputs.country == "ca") {
            countryPS = "CA";
        }
        
        const address = Object.assign(
            {},
            this.state.addressPS,
            { ['countryCode']: countryPS,
              ['city']: addressToSetInInputs.city,
              ['firstName']: this.state.firstNamePS,
              ['lastName']: this.state.lastNamePS,
              ['address1']: addressToSetInInputs.address_line,
              ['postalCode']: addressToSetInInputs.zipcode,
              ['phone']: addressToSetInInputs.store_phone_number,
              ['stateOrProvince']: addressToSetInInputs.state,
              ['stateOrProvinceCode']: stateAbbr,
            }
        );
        this.setState({ isUpdatingShippingData: true });
        this.props.updateAddress(address);
        const {
            values,
            setValues,
        } = this.props;

        setValues({
            ...values,
            shippingAddress: mapAddressToFormValues(this.getFields(address.countryCode),address),
        });
        
    };

    componentDidUpdate({ isValid: prevIsValid }:
        SingleShippingFormProps &
        WithLanguageProps &
        FormikProps<SingleShippingFormValues>
    ): void {
        const { isValid } = this.props;

        if (!prevIsValid && isValid) {
            this.updateAddressWithFormData();
        }
    }

    private shouldDisableSubmit: () => boolean = () => {
        const {
            isLoading,
            consignments,
            isValid,
        } = this.props;

        const {
            isUpdatingShippingData,
        } = this.state;

        if (!isValid) {
            return false;
        }

        return isLoading || isUpdatingShippingData || !hasSelectedShippingOptions(consignments);
    };

    private handleFieldChange: (name: string, value: string) => void = async (name, value) => {
        const {
            setFieldValue,
        } = this.props;
        
        if (name === 'countryCode') {
            setFieldValue('shippingAddress.stateOrProvince', '');
            setFieldValue('shippingAddress.stateOrProvinceCode', '');
        }

        if (name === 'firstName') {
            this.setState({ 'firstNamePS': value });
        }

        if (name === 'lastName') {
            this.setState({ 'lastNamePS': value });
        }
        
        // Enqueue the following code to run after Formik has run validation
        await new Promise(resolve => setTimeout(resolve));

        const isShippingField = SHIPPING_ADDRESS_FIELDS.includes(name);
        
        const { isValid } = this.props;

        if (!isValid || !isShippingField) {
            return;
        }
        
        this.updateAddressWithFormData();
    };

    private updateAddressWithFormData() {
        const {
            shippingAddress,
            values: { shippingAddress: addressForm },
        } = this.props;

        const updatedShippingAddress = addressForm && mapAddressFromFormValues(addressForm);

        if (!updatedShippingAddress || isEqualAddress(updatedShippingAddress, shippingAddress)) {
            return;
        }

        this.setState({ isUpdatingShippingData: true });
        this.debouncedUpdateAddress(updatedShippingAddress);
    }

    private handleAddressSelect: (
        address: Address
    ) => void = async address => {
        const {
            updateAddress,
            onUnhandledError = noop,
            values,
            setValues,
        } = this.props;

        this.setState({ isResettingAddress: true });

        try {
            await updateAddress(address);

            setValues({
                ...values,
                shippingAddress: mapAddressToFormValues(
                    this.getFields(address.countryCode),
                    address
                ),
            });
        } catch (error) {
            onUnhandledError(error);
        } finally {
            this.setState({ isResettingAddress: false });
        }
    };

    private onUseNewAddress: () => void = async () => {
        const {
            deleteConsignments,
            onUnhandledError = noop,
            setValues,
            values,
        } = this.props;

        this.setState({ isResettingAddress: true });

        try {
            const address = await deleteConsignments();
            setValues({
                ...values,
                shippingAddress: mapAddressToFormValues(
                    this.getFields(address && address.countryCode),
                    address
                ),
            });
        } catch (e) {
            onUnhandledError(e);
        } finally {
            this.setState({ isResettingAddress: false });
        }
    };

    private getFields(countryCode: string | undefined): FormField[] {
        const {
            getFields,
        } = this.props;

        return getFields(countryCode);
    }
}

export default withLanguage(withFormik<SingleShippingFormProps & WithLanguageProps, SingleShippingFormValues>({
    handleSubmit: (values, { props: { onSubmit } }) => {
        onSubmit(values);
    },
    mapPropsToValues: ({ getFields, shippingAddress,  customerMessage }) => ({
        billingSameAsShipping: false,
        orderComment: customerMessage,
        shippingAddress: mapAddressToFormValues(
            getFields(shippingAddress && shippingAddress.countryCode),
            shippingAddress
        ),
    }),
    isInitialValid: ({
        shippingAddress,
        getFields,
        language,
        requiredBillingPhoneNumber,
    }) => (
        !!shippingAddress && getAddressValidationSchema({
            language,
            formFields: getFields(shippingAddress.countryCode),
            requiredBillingPhoneNumber,
        }).isValidSync(shippingAddress)
    ),
    validationSchema: ({
        language,
        getFields,
        methodId,
        requiredBillingPhoneNumber,
    }: SingleShippingFormProps & WithLanguageProps) => ( methodId ?
        object() :
        object({
            shippingAddress: lazy<Partial<AddressFormValues>>(formValues =>
                getAddressValidationSchema({
                    language,
                    formFields: getFields(formValues && formValues.countryCode),
                    requiredBillingPhoneNumber,
                })
            ),
        })
    ),
    enableReinitialize: false,
})(SingleShippingForm));
