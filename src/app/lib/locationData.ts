export interface ProvinceData {
  name: string;
  cities: string[];
}

export interface CountryData {
  name: string;
  provinces: ProvinceData[];
}

export const LOCATION_DATA: CountryData[] = [
  {
    name: '中国',
    provinces: [
      {
        name: '北京市',
        cities: ['东城区', '西城区', '朝阳区', '海淀区', '丰台区', '石景山区', '昌平区', '大兴区', '通州区', '顺义区'],
      },
      {
        name: '上海市',
        cities: ['黄浦区', '徐汇区', '静安区', '浦东新区', '长宁区', '普陀区', '虹口区', '杨浦区', '闵行区', '宝山区'],
      },
      {
        name: '广东省',
        cities: ['广州市', '深圳市', '珠海市', '佛山市', '东莞市', '中山市', '惠州市', '汕头市', '江门市', '湛江市'],
      },
      {
        name: '浙江省',
        cities: ['杭州市', '宁波市', '温州市', '嘉兴市', '湖州市', '绍兴市', '金华市', '台州市'],
      },
      {
        name: '江苏省',
        cities: ['南京市', '苏州市', '无锡市', '常州市', '南通市', '徐州市', '扬州市', '盐城市', '镇江市', '连云港市'],
      },
      {
        name: '山东省',
        cities: ['济南市', '青岛市', '烟台市', '潍坊市', '临沂市', '淄博市', '威海市', '济宁市'],
      },
      {
        name: '四川省',
        cities: ['成都市', '绵阳市', '德阳市', '宜宾市', '南充市', '泸州市', '乐山市', '达州市'],
      },
      {
        name: '湖北省',
        cities: ['武汉市', '襄阳市', '宜昌市', '荆州市', '黄冈市', '孝感市', '十堰市'],
      },
      {
        name: '湖南省',
        cities: ['长沙市', '株洲市', '湘潭市', '衡阳市', '岳阳市', '常德市', '郴州市'],
      },
      {
        name: '河南省',
        cities: ['郑州市', '洛阳市', '开封市', '南阳市', '新乡市', '许昌市', '安阳市', '焦作市'],
      },
      {
        name: '河北省',
        cities: ['石家庄市', '保定市', '唐山市', '廊坊市', '邯郸市', '秦皇岛市', '沧州市'],
      },
      {
        name: '福建省',
        cities: ['福州市', '厦门市', '泉州市', '漳州市', '莆田市', '龙岩市', '三明市'],
      },
      {
        name: '陕西省',
        cities: ['西安市', '咸阳市', '宝鸡市', '榆林市', '延安市', '汉中市'],
      },
      {
        name: '辽宁省',
        cities: ['沈阳市', '大连市', '鞍山市', '锦州市', '营口市', '丹东市'],
      },
      {
        name: '重庆市',
        cities: ['渝中区', '江北区', '渝北区', '南岸区', '沙坪坝区', '九龙坡区', '万州区'],
      },
      {
        name: '天津市',
        cities: ['和平区', '河东区', '河西区', '南开区', '滨海新区', '红桥区'],
      },
      {
        name: '安徽省',
        cities: ['合肥市', '芜湖市', '蚌埠市', '阜阳市', '安庆市', '黄山市', '马鞍山市'],
      },
      {
        name: '江西省',
        cities: ['南昌市', '赣州市', '九江市', '上饶市', '宜春市', '景德镇市', '吉安市'],
      },
      {
        name: '广西壮族自治区',
        cities: ['南宁市', '桂林市', '柳州市', '北海市', '玉林市', '百色市'],
      },
      {
        name: '云南省',
        cities: ['昆明市', '大理州', '丽江市', '曲靖市', '红河州', '西双版纳州'],
      },
      {
        name: '贵州省',
        cities: ['贵阳市', '遵义市', '六盘水市', '毕节市', '铜仁市', '安顺市'],
      },
      {
        name: '山西省',
        cities: ['太原市', '大同市', '运城市', '长治市', '临汾市', '晋城市'],
      },
      {
        name: '吉林省',
        cities: ['长春市', '吉林市', '延边州', '四平市', '通化市', '白山市'],
      },
      {
        name: '黑龙江省',
        cities: ['哈尔滨市', '齐齐哈尔市', '大庆市', '牡丹江市', '佳木斯市', '绥化市'],
      },
      {
        name: '内蒙古自治区',
        cities: ['呼和浩特市', '包头市', '鄂尔多斯市', '赤峰市', '呼伦贝尔市'],
      },
      {
        name: '新疆维吾尔自治区',
        cities: ['乌鲁木齐市', '伊犁州', '昌吉州', '喀什地区', '巴音郭楞州'],
      },
      {
        name: '甘肃省',
        cities: ['兰州市', '天水市', '酒泉市', '嘉峪关市', '张掖市', '庆阳市'],
      },
      {
        name: '海南省',
        cities: ['海口市', '三亚市', '儋州市', '琼海市', '文昌市'],
      },
      {
        name: '宁夏回族自治区',
        cities: ['银川市', '石嘴山市', '吴忠市', '固原市', '中卫市'],
      },
      {
        name: '青海省',
        cities: ['西宁市', '海东市', '海西州', '玉树州'],
      },
      {
        name: '西藏自治区',
        cities: ['拉萨市', '日喀则市', '昌都市', '林芝市', '山南市'],
      },
      {
        name: '香港特别行政区',
        cities: ['中西区', '湾仔区', '油尖旺区', '深水埗区', '九龙城区', '沙田区', '元朗区'],
      },
      {
        name: '澳门特别行政区',
        cities: ['澳门半岛', '氹仔岛', '路环岛'],
      },
      {
        name: '台湾省',
        cities: ['台北市', '新北市', '高雄市', '台中市', '台南市', '桃园市', '新竹市'],
      },
    ],
  },
  {
    name: '朝鲜',
    provinces: [
      {
        name: '平壤直辖市',
        cities: ['中区', '平川区', '普通江区', '牡丹峰区', '大同江区', '万景台区', '乐浪区'],
      },
      {
        name: '平安北道',
        cities: ['新义州市', '定州市', '龟城市', '龙川郡'],
      },
      {
        name: '平安南道',
        cities: ['平城市', '顺川市', '德川市', '安州市', '价川市'],
      },
      {
        name: '开城特级市',
        cities: ['开城市', '开丰区'],
      },
      {
        name: '南浦特别市',
        cities: ['港口区', '江西区', '温泉郡'],
      },
      {
        name: '罗先特别市',
        cities: ['罗津区', '先锋区'],
      },
      {
        name: '慈江道',
        cities: ['江界市', '满浦市', '熙川市'],
      },
      {
        name: '两江道',
        cities: ['惠山市', '三池渊市', '普天郡'],
      },
      {
        name: '咸镜北道',
        cities: ['清津市', '会宁市', '茂山郡'],
      },
      {
        name: '咸镜南道',
        cities: ['咸兴市', '端川市', '新浦市'],
      },
      {
        name: '黄海南道',
        cities: ['海州市', '信川郡'],
      },
      {
        name: '黄海北道',
        cities: ['沙里院市', '松林市'],
      },
      {
        name: '江原道',
        cities: ['元山市', '文川市', '通川郡'],
      },
    ],
  },
  {
    name: '日本',
    provinces: [
      {
        name: '东京都',
        cities: ['新宿区', '涩谷区', '港区', '千代田区', '中央区', '世田谷区', '丰岛区'],
      },
      {
        name: '大阪府',
        cities: ['大阪市', '堺市', '丰中市', '吹田市'],
      },
      {
        name: '京都府',
        cities: ['京都市', '宇治市'],
      },
      {
        name: '神奈川县',
        cities: ['横滨市', '川崎市', '镰仓市'],
      },
      {
        name: '爱知县',
        cities: ['名古屋市', '丰田市', '冈崎市'],
      },
      {
        name: '福冈县',
        cities: ['福冈市', '北九州市', '久留米市'],
      },
      {
        name: '北海道',
        cities: ['札幌市', '函馆市', '旭川市', '小樽市'],
      },
      {
        name: '兵库县',
        cities: ['神户市', '姬路市', '西宫市'],
      },
    ],
  },
  {
    name: '韩国',
    provinces: [
      {
        name: '首尔特别市',
        cities: ['江南区', '瑞草区', '麻浦区', '钟路区', '中区', '松坡区'],
      },
      {
        name: '釜山广域市',
        cities: ['海云台区', '釜山镇区', '水营区', '中区'],
      },
      {
        name: '仁川广域市',
        cities: ['延寿区', '中区', '南洞区'],
      },
      {
        name: '京畿道',
        cities: ['水原市', '城南市', '高阳市', '龙仁市'],
      },
      {
        name: '济州特别自治道',
        cities: ['济州市', '西归浦市'],
      },
    ],
  },
  {
    name: '俄罗斯',
    provinces: [
      {
        name: '莫斯科直辖市',
        cities: ['中央行政区', '北部行政区', '西部行政区', '南部行政区'],
      },
      {
        name: '圣彼得堡直辖市',
        cities: ['海军部区', '瓦西里岛区', '中区', '彼得格勒区'],
      },
      {
        name: '莫斯科州',
        cities: ['希姆基', '科罗廖夫', '波多利斯克'],
      },
      {
        name: '滨海边疆区',
        cities: ['符拉迪沃斯托克', '纳霍德卡', '乌苏里斯克'],
      },
      {
        name: '新西伯利亚州',
        cities: ['新西伯利亚'],
      },
      {
        name: '斯维尔德洛夫斯克州',
        cities: ['叶卡捷琳堡'],
      },
    ],
  },
  {
    name: '美国',
    provinces: [
      {
        name: '加利福尼亚州',
        cities: ['洛杉矶', '旧金山', '圣迭戈', '圣何塞', '萨克拉门托'],
      },
      {
        name: '纽约州',
        cities: ['纽约市', '水牛城', '罗彻斯特', '奥尔巴尼'],
      },
      {
        name: '华盛顿州',
        cities: ['西雅图', '塔科马', '斯波坎', '贝尔维尤'],
      },
      {
        name: '德克萨斯州',
        cities: ['休斯敦', '奥斯汀', '达拉斯', '圣安东尼奥'],
      },
      {
        name: '伊利诺伊州',
        cities: ['芝加哥', '内珀维尔', '斯普林菲尔德'],
      },
      {
        name: '华盛顿哥伦比亚特区',
        cities: ['华盛顿'],
      },
    ],
  },
  {
    name: '英国',
    provinces: [
      {
        name: '大伦敦',
        cities: ['伦敦市', '威斯敏斯特', '卡姆登', '格林威治', '肯辛顿'],
      },
      {
        name: '大曼彻斯特',
        cities: ['曼彻斯特', '索尔福德', '博尔顿'],
      },
      {
        name: '西米德兰兹',
        cities: ['伯明翰', '考文垂', '伍尔弗汉普顿'],
      },
      {
        name: '苏格兰',
        cities: ['爱丁堡', '格拉斯哥', '阿伯丁'],
      },
    ],
  },
  {
    name: '法国',
    provinces: [
      {
        name: '法兰西岛',
        cities: ['巴黎', '凡尔赛', '布洛涅-比扬古', '楠泰尔'],
      },
      {
        name: '普罗旺斯-阿尔卑斯-蓝色海岸',
        cities: ['马赛', '尼斯', '戛纳', '艾克斯'],
      },
      {
        name: '奥弗涅-罗讷-阿尔卑斯',
        cities: ['里昂', '格勒诺布尔', '圣艾蒂安'],
      },
    ],
  },
  {
    name: '德国',
    provinces: [
      {
        name: '柏林州',
        cities: ['柏林'],
      },
      {
        name: '巴伐利亚州',
        cities: ['慕尼黑', '纽伦堡', '奥格斯堡'],
      },
      {
        name: '北莱茵-威斯特法伦州',
        cities: ['科隆', '杜塞尔多夫', '多特蒙德', '埃森'],
      },
      {
        name: '汉堡州',
        cities: ['汉堡'],
      },
    ],
  },
  {
    name: '新加坡',
    provinces: [
      {
        name: '新加坡',
        cities: ['中央商务区', '乌节路', '裕廊东', '樟宜', '圣淘沙', '淡滨尼'],
      },
    ],
  },
  {
    name: '澳大利亚',
    provinces: [
      {
        name: '新南威尔士州',
        cities: ['悉尼', '纽卡斯尔', '卧龙岗'],
      },
      {
        name: '维多利亚州',
        cities: ['墨尔本', '吉朗', '巴拉瑞特'],
      },
      {
        name: '昆士兰州',
        cities: ['布里斯班', '黄金海岸', '阳光海岸'],
      },
    ],
  },
  {
    name: '加拿大',
    provinces: [
      {
        name: '安大略省',
        cities: ['多伦多', '渥太华', '密西沙加', '哈密尔顿'],
      },
      {
        name: '不列颠哥伦比亚省',
        cities: ['温哥华', '维多利亚', '列治文', '本拿比'],
      },
      {
        name: '魁北克省',
        cities: ['蒙特利尔', '魁北克市', '拉瓦勒'],
      },
    ],
  },
];

// 快捷热门地名预设
export const POPULAR_LOCATIONS = [
  '朝鲜 · 平壤',
  '中国 · 北京',
  '中国 · 广东 · 深圳',
  '中国 · 上海',
  '中国 · 浙江 · 杭州',
  '中国 · 四川 · 成都',
  '俄罗斯 · 莫斯科',
  '日本 · 东京',
  '英国 · 伦敦',
  '法国 · 巴黎',
];

/**
 * 辅助函数：根据现有 location 字符串推导可能匹配的国家、省份、城市
 */
export function parseLocation(str: string): { country: string; province: string; city: string } {
  if (!str) return { country: '朝鲜', province: '平壤直辖市', city: '中区' };
  
  // 清洗分隔符：可以是 "·", " ", "-", "/"
  const parts = str.split(/[\s·\-\/]+/).map((s) => s.trim()).filter(Boolean);
  
  if (parts.length === 0) {
    return { country: '朝鲜', province: '平壤直辖市', city: '中区' };
  }

  // 1. 尝试匹配国家
  let matchedCountry = LOCATION_DATA.find((c) => c.name === parts[0] || parts[0].includes(c.name));
  
  if (!matchedCountry) {
    // 如果 parts[0] 是国内的某个省或市（比如直接叫 "北京" 或 "深圳"）
    for (const c of LOCATION_DATA) {
      for (const p of c.provinces) {
        if (p.name.includes(parts[0]) || parts[0].includes(p.name)) {
          matchedCountry = c;
          break;
        }
        if (p.cities.some((ct) => ct.includes(parts[0]) || parts[0].includes(ct))) {
          matchedCountry = c;
          break;
        }
      }
      if (matchedCountry) break;
    }
  }

  const country = matchedCountry || LOCATION_DATA[1]; // 默认朝鲜或匹配到的国家
  
  // 2. 匹配省份
  let matchedProvince: ProvinceData | undefined;
  if (parts.length > 1) {
    matchedProvince = country.provinces.find(
      (p) => p.name === parts[1] || p.name.includes(parts[1]) || parts[1].includes(p.name)
    );
  }
  if (!matchedProvince) {
    matchedProvince = country.provinces.find((p) =>
      parts.some((pt) => p.name.includes(pt) || pt.includes(p.name))
    );
  }
  const province = matchedProvince || country.provinces[0];

  // 3. 匹配城市
  let matchedCity = '';
  if (parts.length > 2) {
    matchedCity = province.cities.find(
      (c) => c === parts[2] || c.includes(parts[2]) || parts[2].includes(c)
    ) || '';
  }
  if (!matchedCity) {
    matchedCity = province.cities.find((c) =>
      parts.some((pt) => c.includes(pt) || pt.includes(c))
    ) || province.cities[0] || '';
  }

  return {
    country: country.name,
    province: province.name,
    city: matchedCity,
  };
}
