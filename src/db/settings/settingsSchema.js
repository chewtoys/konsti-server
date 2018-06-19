/* @flow */
import mongoose from 'mongoose'

const SettingsSchema = mongoose.Schema({
  blacklistedGames: Array,
  canceledGames: Array,
  signupTime: Date,
})

const Settings = mongoose.model('Settings', SettingsSchema)

export default Settings
