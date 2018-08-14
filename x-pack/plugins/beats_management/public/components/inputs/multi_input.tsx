/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */
import { CommonProps, EuiFormRow, EuiTextArea, EuiTextAreaProps } from '@elastic/eui';
// @ts-ignore
import { FormsyInputProps, withFormsy } from 'formsy-react';
import React, { Component, InputHTMLAttributes } from 'react';

interface ComponentProps extends FormsyInputProps, CommonProps, EuiTextAreaProps {
  instantValidation: boolean;
  label: string;
  errorText: string;
  fullWidth: boolean;
  helpText: React.ReactElement<any>;
  compressed: boolean;
  onChange(e: React.ChangeEvent<HTMLTextAreaElement>, value: any): void;
  onBlur(e: React.ChangeEvent<HTMLTextAreaElement>, value: any): void;
}

interface ComponentState {
  allowError: boolean;
}

class MultiFieldText extends Component<
  InputHTMLAttributes<HTMLTextAreaElement> & ComponentProps,
  ComponentState
> {
  public static defaultProps = {
    passRequiredToField: true,
  };

  public state = { allowError: false };

  public componentDidMount() {
    const { defaultValue, setValue } = this.props;
    if (defaultValue) {
      setValue(defaultValue);
    }
  }

  public componentWillReceiveProps(nextProps: ComponentProps) {
    if (nextProps.isFormSubmitted()) {
      this.showError();
    }
  }

  public handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.currentTarget;
    this.props.setValue(value);
    if (this.props.onChange) {
      this.props.onChange(e, e.currentTarget.value);
    }
    if (this.props.instantValidation) {
      this.showError();
    }
  };

  public handleBlur = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    this.showError();
    if (this.props.onBlur) {
      this.props.onBlur(e, e.currentTarget.value);
    }
  };

  public showError = () => this.setState({ allowError: true });

  public render() {
    const {
      id,
      required,
      label,
      defaultValue,
      value,
      isValid,
      isPristine,
      getErrorMessage,
      fullWidth,
      className,
      disabled,
      helpText,
    } = this.props;

    const { allowError } = this.state;
    const error = !isPristine() && !isValid() && allowError;

    return (
      <EuiFormRow
        id={id}
        label={label}
        helpText={helpText}
        isInvalid={!disabled && error}
        error={!disabled && error ? getErrorMessage() : []}
      >
        <EuiTextArea
          id={id}
          name={name}
          value={value}
          defaultValue={defaultValue}
          isInvalid={!disabled && error}
          onChange={this.handleChange}
          onBlur={this.handleBlur}
          fullWidth={fullWidth}
          disabled={disabled}
          required={required}
          className={className}
        />
      </EuiFormRow>
    );
  }
}

export const FormsyEuiMultiFieldText = withFormsy(MultiFieldText);
