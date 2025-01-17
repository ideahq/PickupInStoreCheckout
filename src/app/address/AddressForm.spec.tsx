import { createCheckoutService, CheckoutService, FormField } from '@bigcommerce/checkout-sdk';
import { mount, ReactWrapper } from 'enzyme';
import { Formik } from 'formik';
import { noop } from 'lodash';
import React from 'react';

import { getCheckout } from '../checkout/checkouts.mock';
import { getStoreConfig } from '../config/config.mock';
import { createLocaleContext, LocaleContext, LocaleContextType } from '../locale';

import { getFormFields } from './formField.mock';
import AddressForm from './AddressForm';
import DynamicFormField from './DynamicFormField';
import DynamicFormFieldType from './DynamicFormFieldType';

describe('AddressForm Component', () => {
    let checkoutService: CheckoutService;
    let localeContext: LocaleContextType;
    let component: ReactWrapper;
    let formFields: FormField[];

    beforeEach(() => {
        checkoutService = createCheckoutService();
        localeContext = createLocaleContext(getStoreConfig());
        formFields = getFormFields();

        jest.spyOn(checkoutService.getState().data, 'getCheckout').mockReturnValue(getCheckout());
        jest.spyOn(checkoutService.getState().data, 'getConfig').mockReturnValue(getStoreConfig());
    });

    it('renders all DynamicFormField based on formFields', () => {
        component = mount(
            <LocaleContext.Provider value={ localeContext }>
                <Formik
                    initialValues={ {} }
                    onSubmit={ noop }
                >
                    <AddressForm
                        fieldName="address"
                        formFields={ formFields }
                    />
                </Formik>
            </LocaleContext.Provider>
        );

        expect(component.find(DynamicFormField).length).toEqual(formFields.length);
    });

    it('renders DynamicFormField with expected props', () => {
        component = mount(
            <LocaleContext.Provider value={ localeContext }>
                <Formik
                    initialValues={ {} }
                    onSubmit={ noop }
                >
                    <AddressForm
                        fieldName="address"
                        formFields={ formFields }
                    />
                </Formik>
            </LocaleContext.Provider>
        );

        expect(component.find(DynamicFormField).at(0).props()).toEqual(
            expect.objectContaining({
                parentFieldName: 'address',
                fieldType: DynamicFormFieldType.text,
                placeholder: undefined,
            })
        );

        expect(component.find(DynamicFormField).at(0).prop('field')).toEqual(
            expect.objectContaining({
                id: 'field_14',
            })
        );
    });

    it('renders calls onChange when a field is updated', () => {
        const onChange = jest.fn();

        component = mount(
            <LocaleContext.Provider value={ localeContext }>
                <Formik
                    initialValues={ {
                        address1: 'foo',
                    } }
                    onSubmit={ noop }
                >
                    <AddressForm
                        formFields={ formFields }
                        onChange={ onChange }
                    />
                </Formik>
            </LocaleContext.Provider>
        );

        component.find('input[name="address1"]')
                .simulate('change', { target: { value: 'foo bar', name: 'address1' } });

        expect(onChange).toHaveBeenCalledWith('address1', 'foo bar');
    });
});
