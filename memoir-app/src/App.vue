<script>
export default {
  onLaunch: function () {
    console.log('App Launch')
  },
  onShow: function () {
    console.log('App Show')
  },
  onHide: function () {
    console.log('App Hide')
  },
}
</script>

<style>
/*每个页面公共css */
@import './common/font.css';

/* 兼容不同平台 */
page {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

/* 确保导航栏标题使用高端现代字体 */
.uni-page-head .uni-page-head__title,
.uni-page-head__title {
  font-family: "PingFang SC", "苹方", "Source Han Sans CN", "思源黑体", "Noto Sans CJK SC", "Microsoft YaHei", "微软雅黑", -apple-system, BlinkMacSystemFont, sans-serif !important;
  font-weight: 300 !important;
  font-size: 16px !important;
  letter-spacing: 0.5px !important;
  font-style: normal !important;
}

/* 为所有可能的导航栏选择器添加样式 */
uni-page-head .uni-page-head__title,
[class*="uni-page-head"] .uni-page-head__title,
.uni-page-wrapper .uni-page-head .uni-page-head__title {
  font-family: "PingFang SC", "苹方", "Source Han Sans CN", "思源黑体", "Noto Sans CJK SC", "Microsoft YaHei", "微软雅黑", -apple-system, BlinkMacSystemFont, sans-serif !important;
  font-weight: 300 !important;
  font-size: 16px !important;
  letter-spacing: 0.5px !important;
  font-style: normal !important;
}
</style>
