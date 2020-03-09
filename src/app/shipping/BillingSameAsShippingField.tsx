import React, { memo, useMemo, FunctionComponent } from 'react';

import { TranslatedString } from '../locale';
import { CheckboxFormField } from '../ui/form';

export interface BillingSameAsShippingFieldProps {
    onChange?(isChecked: boolean): void;
}

const BillingSameAsShippingField: FunctionComponent<BillingSameAsShippingFieldProps>  = ({
    onChange,
    checkShippingDiv,
    checkBoxValue,
}) => {
    const labelContent = useMemo(() => (
        <TranslatedString id="billing.use_shipping_address_label" />
    ), []);

    return <CheckboxFormField
        additionalClassName={ `${!checkShippingDiv ? 'inActiveFieldPS' : 'activeFieldPS'}` }
        id="sameAsBilling"
        labelContent={ labelContent }
        name="billingSameAsShipping"
        onChange={ onChange }
    />;
};

export default memo(BillingSameAsShippingField);
