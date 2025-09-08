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

/* 确保导航栏标题使用中文艺术字体 */
.uni-page-head .uni-page-head__title,
.uni-page-head__title {
  font-family: "STXingkai", "华文行楷", "KaiTi", "楷体", "SimKai", "Microsoft YaHei", cursive !important;
  font-weight: 500 !important;
  font-size: 18px !important;
  letter-spacing: 1.5px !important;
}

/* 为所有可能的导航栏选择器添加样式 */
uni-page-head .uni-page-head__title,
[class*="uni-page-head"] .uni-page-head__title,
.uni-page-wrapper .uni-page-head .uni-page-head__title {
  font-family: "STXingkai", "华文行楷", "KaiTi", "楷体", "SimKai", "Microsoft YaHei", cursive !important;
  font-weight: 500 !important;
  letter-spacing: 1.5px !important;
}
</style>
