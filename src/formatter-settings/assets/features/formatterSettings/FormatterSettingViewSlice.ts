// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { createSlice } from "@reduxjs/toolkit";
import { Catagory, ExampleKind, JavaFormatterSetting } from "../../../FormatterConstants";
import { initializeSupportedSettings } from "./SupportedSettings";
import { applyChanges, changeExampleKind } from "../../vscode.api";

export const formatterSettingsViewSlice = createSlice({
  name: "formatterSettings",
  initialState: {
    activeCatagory: Catagory.Common,
    activePreviewExampleKind: ExampleKind.COMMON_EXAMPLE,
    settings: [] as JavaFormatterSetting[],
    version: 21,
    exampleKind: ExampleKind.COMMON_EXAMPLE,
    formattedContent: "",
    settingsChanged: false,
    format: false,
  },
  reducers: {
    changeActiveCatagory: (state, action) => {
      const activeCatagory: Catagory = action.payload as Catagory;
      state.activeCatagory = activeCatagory;
      switch (activeCatagory) {
        case Catagory.Blankline:
          state.exampleKind = ExampleKind.BLANKLINE_EXAMPLE;
          break;
        case Catagory.Comment:
          state.exampleKind = ExampleKind.COMMENT_EXAMPLE;
          break;
        case Catagory.Common:
          state.exampleKind = ExampleKind.COMMON_EXAMPLE;
          break;
        case Catagory.Newline:
          state.exampleKind = ExampleKind.NEWLINE_EXAMPLE;
          break;
        case Catagory.Whitespace:
          state.exampleKind = ExampleKind.WHITESPACE_EXAMPLE;
          break;
        case Catagory.Wrapping:
          state.exampleKind = ExampleKind.WRAPPING_EXAMPLE;
          break;
      }
      state.format = false;
      changeExampleKind(state.exampleKind);
    },
    changePreviewExample: (state, action) => {
      if (action.payload.exampleKind !== state.activePreviewExampleKind) {
        state.activePreviewExampleKind = action.payload.exampleKind;
        state.exampleKind = state.activePreviewExampleKind;
        changeExampleKind(state.exampleKind);
      }
      state.format = false;
    },
    initVersion: (state, action) => {
      state.version = Number(action.payload.version);
      state.settings = initializeSupportedSettings(state.version);
    },
    initSetting: (state, action) => {
      for (const setting of state.settings) {
        if (setting.id === action.payload.id) {
          setting.value = action.payload.value;
          break;
        }
      }
    },
    updateSetting: (state, action) => {
      state.settingsChanged = true;
      for (const setting of state.settings) {
        if (setting.id === action.payload.id) {
          setting.value = action.payload.value;
          break;
        }
      }
    },
    applyFormatResult: (state, action) => {
      state.formattedContent = action.payload.content;
      state.format = true;
    },
    applySettingChange: (state, _action) => {
      state.settingsChanged = false;
      applyChanges();
    },
  },
});

export const {
  changeActiveCatagory,
  changePreviewExample,
  initVersion,
  initSetting,
  updateSetting,
  applyFormatResult,
  applySettingChange,
} = formatterSettingsViewSlice.actions;

export default formatterSettingsViewSlice.reducer;
