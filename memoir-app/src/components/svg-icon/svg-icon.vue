<template>
  <view class="svg-icon" :style="iconStyle">
    <view v-if="name === 'home'" class="icon-home">
      <view class="icon-path"></view>
    </view>
    <view v-else-if="name === 'home-filled'" class="icon-home-filled">
      <view class="icon-path"></view>
    </view>
    <view v-else-if="name === 'book'" class="icon-book">
      <view class="icon-path"></view>
    </view>
    <view v-else-if="name === 'book-filled'" class="icon-book-filled">
      <view class="icon-path"></view>
    </view>
    <view v-else-if="name === 'edit'" class="icon-edit">
      <view class="icon-path"></view>
    </view>
    <view v-else-if="name === 'edit-filled'" class="icon-edit-filled">
      <view class="icon-path"></view>
    </view>
    <view v-else-if="name === 'user'" class="icon-user">
      <view class="icon-path"></view>
    </view>
    <view v-else-if="name === 'user-filled'" class="icon-user-filled">
      <view class="icon-path"></view>
    </view>
    <view v-else-if="name === 'chat'" class="icon-chat">
      <view class="icon-path"></view>
    </view>
    <view v-else-if="name === 'chat-filled'" class="icon-chat-filled">
      <view class="icon-path"></view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'SvgIcon',
  props: {
    name: {
      type: String,
      required: true
    },
    size: {
      type: [String, Number],
      default: 24
    },
    color: {
      type: String,
      default: '#7A7E83'
    }
  },
  computed: {
    iconStyle() {
      return {
        width: this.size + 'px',
        height: this.size + 'px',
        color: this.color
      }
    }
  }
}
</script>

<style scoped>
.svg-icon {
  display: inline-block;
  position: relative;
}

.icon-path {
  width: 100%;
  height: 100%;
  background-color: currentColor;
  mask-size: contain;
  mask-repeat: no-repeat;
  mask-position: center;
}

/* Home 图标 */
.icon-home .icon-path {
  mask-image: url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z' stroke='black' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M9 22V12H15V22' stroke='black' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
}

.icon-home-filled .icon-path {
  mask-image: url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z' fill='black'/%3E%3Cpath d='M9 22V12H15V22' fill='black'/%3E%3C/svg%3E");
}

/* Book 图标 */
.icon-book .icon-path {
  mask-image: url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M4 19.5A2.5 2.5 0 0 1 6.5 17H20' stroke='black' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M6.5 2H20V22H6.5A2.5 2.5 0 0 1 4 19.5V4.5A2.5 2.5 0 0 1 6.5 2Z' stroke='black' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
}

.icon-book-filled .icon-path {
  mask-image: url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M4 19.5A2.5 2.5 0 0 1 6.5 17H20' fill='black'/%3E%3Cpath d='M6.5 2H20V22H6.5A2.5 2.5 0 0 1 4 19.5V4.5A2.5 2.5 0 0 1 6.5 2Z' fill='black'/%3E%3C/svg%3E");
}

/* Edit 图标 */
.icon-edit .icon-path {
  mask-image: url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13' stroke='black' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M18.5 2.5C18.8978 2.10218 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10218 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10218 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z' stroke='black' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
}

.icon-edit-filled .icon-path {
  mask-image: url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13' fill='black'/%3E%3Cpath d='M18.5 2.5C18.8978 2.10218 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10218 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10218 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z' fill='black'/%3E%3C/svg%3E");
}

/* User 图标 */
.icon-user .icon-path {
  mask-image: url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21' stroke='black' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3Ccircle cx='12' cy='7' r='4' stroke='black' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
}

.icon-user-filled .icon-path {
  mask-image: url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21' fill='black'/%3E%3Ccircle cx='12' cy='7' r='4' fill='black'/%3E%3C/svg%3E");
}

/* Chat 图标 */
.icon-chat .icon-path {
  mask-image: url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z' stroke='black' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
}

.icon-chat-filled .icon-path {
  mask-image: url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z' fill='black'/%3E%3C/svg%3E");
}
</style>
