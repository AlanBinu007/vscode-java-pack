// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import checkIcon from "@iconify-icons/codicon/check";
import chevronDownIcon from "@iconify-icons/codicon/chevron-down";
import { Icon } from "@iconify/react";
import { Dispatch } from "@reduxjs/toolkit";
import React from "react";
import { Dropdown, Form } from "react-bootstrap";
import { useDispatch } from "react-redux";
import { Catagory, JavaFormatterSetting, ValueKind } from "../../../../FormatterConstants";
import { changeSetting } from "../../../vscode.api";
import { formatterConverter } from "../FormatterConverter";
import { updateSetting } from "../formatterSettingViewSlice";

export interface SettingProps {
  setting: JavaFormatterSetting[];
  catagory: Catagory;
  filterValue?: string;
}

const Setting = (prop: SettingProps): JSX.Element => {

  const dispatch: Dispatch<any> = useDispatch();

  const handleChangeCheckbox = (e: any) => {
    const id = e.target.id;
    const value = (e.target.checked === true) ? "true" : "false";
    dispatch(updateSetting({ id: id, value: formatterConverter.valueConvert(id, value) }));
    changeSetting(id, value);
  };

  const handleChangeInput = (e: any) => {
    const id = e.target.id;
    let value = e.target.value;
    if (!value || value === "") {
      value = "0";
    }
    dispatch(updateSetting({ id: id, value: value }));
    changeSetting(id, value);
  };

  const handleSelect = (setting: JavaFormatterSetting, entry: string) => {
    dispatch(updateSetting({ id: setting.id, value: entry }));
    changeSetting(setting.id, entry);
  };



  const generateSettingsLeaf = (setting: JavaFormatterSetting) => {
    if (!setting.name || !setting.id || !setting.value) {
      return;
    }
    const candidates = [];
    switch (setting.valueKind as ValueKind) {
      case ValueKind.Boolean:
        return (
          <div className="setting-section">
            <Form.Check type="checkbox" id={`${setting.id}`} >
              <Form.Check.Input type="checkbox" checked={(setting.value === "true" || setting.value === "insert")} onChange={handleChangeCheckbox} />
              <Form.Check.Label className="setting-section-description">
                <Icon className="codicon" icon={checkIcon} />
                <div className="setting-section-description-checkbox">{setting.name}.</div>
              </Form.Check.Label>
            </Form.Check>
          </div>
        );
      case ValueKind.Enum:
        if (!setting.candidates) {
          return (<div></div>);
        }
        for (const candidate of setting.candidates) {
          candidates.push(
            <Dropdown.Item className="dropdown-item py-0 pl-1" onSelect={() => handleSelect(setting, candidate)}>
              {candidate}
            </Dropdown.Item>
          );
        }
        return (
          <div className="setting-section">
            <span className="setting-section-description">{setting.name}.</span>
            <Dropdown className="mt-1">
              <Dropdown.Toggle className="dropdown-button flex-vertical-center text-left">
                <span>{setting.value}</span>
                <Icon className="codicon" icon={chevronDownIcon} />
              </Dropdown.Toggle>
              <Dropdown.Menu className="dropdown-menu mt-0 p-0">
                {candidates}
              </Dropdown.Menu>
            </Dropdown>
          </div >
        );
      case ValueKind.Number:
        return (
          <div className="setting-section">
            <Form.Label className="setting-section-description">{setting.name}.</Form.Label>
            <Form.Control className="pl-1 mt-1" type="number" id={setting.id} defaultValue={setting.value} onChange={handleChangeInput}></Form.Control>
          </div>
        );
      default:
        return;
    }
  };

  if (!prop.setting) {
    return <div></div>;
  }
  const result = prop.setting.map((value, _index) => {
    if (value.catagory === prop.catagory) {
      return generateSettingsLeaf(value);
    }
    return <div></div>;
  });
  return (
    <div className="setting">{result}</div>
  );
};

export default Setting;
