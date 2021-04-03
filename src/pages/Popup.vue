<template>
  <div>
    <button @click="openScreenshotsList" class="bg-blue-500 rounded-lg font-bold text-sm text-white text-center px-4 py-2 transition duration-300 ease-in-out hover:bg-blue-600 ml-3">Screenshots</button>
  </div>
</template>

<script>
import browser from "webextension-polyfill"

export default {
  methods: {
    openScreenshotsList() {
      window.open(browser.extension.getURL("build/pages/index.html")+"#/screenshots");
    }
  }
}
</script>

<style>

</style>