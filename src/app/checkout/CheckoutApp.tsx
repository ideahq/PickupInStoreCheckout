import { createCheckoutService, createEmbeddedCheckoutMessenger } from '@bigcommerce/checkout-sdk';
import { createRequestSender, Response } from '@bigcommerce/request-sender';
import { BrowserOptions } from '@sentry/browser';
import React, { Component } from 'react';
import ReactModal from 'react-modal';

import '../../scss/App.scss';
import { StepTracker, StepTrackerFactory } from '../analytics';
import { createErrorLogger, ErrorBoundary, ErrorLogger } from '../common/error';
import { NewsletterService, NewsletterSubscribeData } from '../customer';
import { createEmbeddedCheckoutStylesheet, createEmbeddedCheckoutSupport } from '../embeddedCheckout';
import { getLanguageService, LocaleProvider } from '../locale';
import { FlashMessage } from '../ui/alert';

import Checkout from './Checkout';
import CheckoutProvider from './CheckoutProvider';

export interface CheckoutAppProps {
    checkoutId: string;
    containerId: string;
    flashMessages?: FlashMessage[]; // TODO: Expose flash messages from SDK
    publicPath?: string;
    sentryConfig?: BrowserOptions;
}

export default class CheckoutApp extends Component<CheckoutAppProps> {
    private checkoutService = createCheckoutService({
        locale: getLanguageService().getLocale(),
        shouldWarnMutation: process.env.NODE_ENV === 'development',
    });
    private embeddedStylesheet = createEmbeddedCheckoutStylesheet();
    private embeddedSupport = createEmbeddedCheckoutSupport(getLanguageService());
    private errorLogger: ErrorLogger;
    private newsletterService = new NewsletterService(createRequestSender());
    private stepTrackerFactory = new StepTrackerFactory(this.checkoutService);

    constructor(props: Readonly<CheckoutAppProps>) {
        super(props);

        this.errorLogger = createErrorLogger(
            { sentry: props.sentryConfig },
            {
                errorTypes: ['UnrecoverableError'],
                publicPath: props.publicPath,
            }
        );
    }

    componentDidMount(): void {
        const { containerId } = this.props;

        ReactModal.setAppElement(`#${containerId}`);
    }

    render() {
        return (
            <ErrorBoundary logger={ this.errorLogger }>
                <LocaleProvider checkoutService={ this.checkoutService }>
                    <CheckoutProvider checkoutService={ this.checkoutService }>
                        <Checkout
                            { ...this.props }
                            createEmbeddedMessenger={ createEmbeddedCheckoutMessenger }
                            createStepTracker={ this.createStepTracker }
                            embeddedStylesheet={ this.embeddedStylesheet }
                            embeddedSupport={ this.embeddedSupport }
                            checkoutService={ this.checkoutService }
                            errorLogger={ this.errorLogger }
                            subscribeToNewsletter={ this.subscribeToNewsletter }
                        />
                    </CheckoutProvider>
                </LocaleProvider>
            </ErrorBoundary>
        );
    }

    private createStepTracker: () => StepTracker = () => {
        return this.stepTrackerFactory.createTracker();
    };

    private subscribeToNewsletter: (data: NewsletterSubscribeData) => Promise<Response> = data => {
        return this.newsletterService.subscribe(data);
    };
}
