/**
 * @module GR
 */

(function(g) {
    var _gr = g.gr;

    /**
     * gr全局对象.
     * @class gr
     * @global
     */
    g.gr = {
        /**
         * GR宿主.
         * @property {Object} global
         */
        global: g,

        /**
         * 版本号.
         * @property {String} version
         */
        version: '1.0.0',

        /**
         * GR环境变量.
         * @private
         */
        env: {
            mods: {},
            _guid: 0
        },

        /**
         * GR下创建唯一ID字符串标识.
         * @method guid
         * @param {String} pre 前缀，可选.
         * @return {String} ID.
         */
        guid: function(pre) {
            return (pre || '_gr_') + (++this.env._guid);
        },

        /**
         * 错误抛出.
         * @method error
         * @param {String} msg 出错信息.
         * @return {Object} GR对象.
         */
        error: function(msg) {
            var ret, cfg = this.cfg;

            if (cfg.errorFn) {
                ret = cfg.errorFn.apply(this, arguments);
            }

            if (!ret) {
                throw msg instanceof Error ? msg : new Error(msg);
            }
        },

        /**
         * 控制台输出.
         * @method log
         * @param {String} msg 输出到控制台的信息.
         * @param {String} [cat] 输出类型，有warn、info、erro等，默认“console.log()”.
         * @param {String} [src] 信息来源.
         * @return {Object} GR对象.
         */
        log: function(msg, cat, src) {
            var cfg = this.cfg;

            if (cfg.debug) {
                if (cfg.logFn) {
                    cfg.logFn.call(this, msg, cat, src);
                } else if (g.console && console[cat || (cat='log')]) {
                    console[cat](src ? src + ': ' + msg : msg);
                }
            }
        },

        /**
         * GR 全局配置.
         * @property {Object} config
         */
        cfg: {
            debug: 'debug',
            useCache: '',
            useNativeES5: '',
            locale: 'zh-cn',
            base: '/'
        },

        /**
         * 修改全局配置.
         * @method applyConfig
         * @param {Object} cfg 新配置信息.
         */
        applyCfg: function(cfg) {
            cfg = cfg || {};

            var name,
                attr,
                config = this.cfg;

            for (name in cfg) {
                if (cfg.hasOwnProperty(name)) {
                    attr = cfg[name];
                    config[name] = attr;
                }
            }
        },

        /**
         * 创建命名空间.
         * 当最后一个参数为true时，为global对象.
         * gr.namespace('app'); -> returns gr.app
         * gr.namespace('app.power'); -> returns gr.app.power
         * gr.namespace('YinHoo.app', true); -> returns YinHoo.app
         * @method namespace
         * @param {String} namespace* 要创建的命名空间名称.
         * @return {Object} 最后一个创建的对象.
         */
        namespace: function() {
            var args = Array.prototype.slice.call(arguments, 0),
                v,
                i = 0,
                j,
                nsDef = args[args.length - 1] === true ? g : this,
                ns,
                w;

            for (; (v = args[i]) && typeof v === 'string'; ++i) {
                v = v.split('.');
                ns = nsDef;
                for (j = (g[v[0]] === ns ? 1 : 0); w = v[j]; ++j) {
                    ns = ns[w] = ns[w] || {};
                }
            }

            return ns;
        },

        /**
         * 获取任意对象的唯一ID标记.
         * 如果为readOnly，对象没uniqueID且未被标记过，则返回null.
         * @method stamp
         * @param {Object|String} obj 要标记的对象.
         * @param {Boolean} readOnly 是否为只读，若为true，则对象未被标记则返回undefined.
         * @return {String|null} 返回对象的唯一标记，若readOnly为true，则对象若为标记过则返回null.
         */
        stamp: function(obj, readOnly) {
            if (!obj) {
                return obj;
            }

            var oid, strStamp = '_gr_oid';

            // 针对dom节点，IE独有的对每个节点创建一个uniqueID
            if (obj.uniqueID && obj.nodeType && obj.nodeType != 9) {
                oid = obj.uniqueID;
            } else {
                oid = typeof obj === 'string' ? obj : obj[strStamp];
            }

            if (!oid) {
                oid = this.guid();
                if (!readOnly) {
                    try {
                        obj[strStamp] = oid;
                    } catch(e) {
                        oid = null;
                    }
                }
            }

            return oid;
        },

        /**
         * 获取当前时间戳(milliseconds).
         * @method now
         * @return {Number} 当前时间戳.
         */
        now: Date.now || (function() {
            return +new Date();
        }),

        /**
         * 释放GR的控制权.
         * @method noConflict
         * @return {gr}
         */
        noConflict: function() {
            if (g.gr === this) {
                g.gr = _gr;
            }

            return this;
        }
    };

    if (typeof module === "object" && module && typeof module.exports === "object") {
        module.exports = g.gr;
    } else {
        if ( typeof define === "function" && define.amd ) {
            define("gr", [], function () { return gr; });
        }
    }
})(this);
(function(V, undefined){
    V = V.gr;
/**
 * @module GR
 * @submodule GR-lang
 */

var OP = Object.prototype,
    TOSTRING = OP.toString,
    HASOWN = function(obj, key) {
        return OP.hasOwnProperty.call(obj, key);
    },
    HOST = V.global,
    TYPES = {
        'undefined'        : 'undefined',
        'number'           : 'number',
        'boolean'          : 'boolean',
        'string'           : 'string',
        '[object Function]': 'function',
        '[object RegExp]'  : 'regexp',
        '[object Array]'   : 'array',
        '[object Date]'    : 'date',
        '[object Error]'   : 'error'
    },
    NATIVE_FN_REGEX = /\{\s*\[(?:native code|function)\]\s*\}/i;

/**
 * 检测函数是否为原生的，如果GR配置useNativeES5为false，则一直返回false.
 * @method _isNative
 * @for gr
 * @param {Function} fn 要检测的函数.
 * @return {Boolean} 如果是native code则返回true.
 */
V._isNative = function(fn) {
    return !!(V.cfg.useNativeES5 && fn && NATIVE_FN_REGEX.test(fn));
};

/**
 * 类型检测，返回以下字符串：
    "array"
    "boolean"
    "date"
    "error"
    "function"
    "null"
    "number"
    "object"
    "regexp"
    "string"
    "undefined"
 * @method typeOf
 * @param {Object} o 要检测对象.
 * @return {String} 返回检测的类型字符串.
 */
V.typeOf = function(o) {
    return TYPES[typeof o] || TYPES[TOSTRING.call(o)] || (o ? 'object' : 'null');
};

/**
 * 测试给定对象是否为function.
 * @method isFunction
 * @param {*} o 要检测的对象.
 * @return {Boolean} 如果是function则返回true.
 */
V.isFunction = function(o) {
    return V.typeOf(o) === 'function';
};

/**
 * 测试给定对象是否为string.
 * @method isString
 * @param {*} val 要检测的对象.
 * @return {Boolean} 如果是string则返回true.
 */
V.isString = function(val) {
    return typeof val === 'string';
};

/**
 * 测试给定对象是否为boolean类型.
 * @method isBoolean
 * @param {*} o 要检测的对象.
 * @return {Boolean} 如果是boolean类型则返回true.
 */
V.isBoolean = function(o) {
    return typeof o === 'boolean';
};

/**
 * 测试给定对象是否有定义（非undefined，但注意 undefined == null）.
 * @method isDefined
 * @param {*} o 要检测的对象.
 * @return {Boolean} 如果已定义则返回true.
 */
V.isDefined = function(o) {
    return o !== undefined;
};

/**
 * 测试给定对象是否为null对象.
 * @method isNull
 * @param {*} o 要检测的对象.
 * @return {Boolean} 如果是则返回true.
 */
V.isNull = function(o) {
    return o === null;
};

/**
 * 测试给定对象是否为Date对象.
 * @method isDate
 * @param {*} o 要检测的对象.
 * @return {Boolean} 如果是则返回true.
 */
V.isDate = function(o) {
    return !!(o && o.getTimezoneOffset && o.setUTCFullYear);
};

/**
 * 测试给定对象是否为数组.
 * @method isArray
 * @param {*} o 要检测的对象.
 * @return {Boolean} 如果是则返回true.
 */
V.isArray = V._isNative(Array.isArray) ? Array.isArray : function(o) {
    return V.typeOf(o) === 'array';
};

/**
 * 测试对象是否为类数组形态(如果为一个object，则必须有length属性).
 * @method isArrayLike
 * @param {*} o 要检测的对象.
 * @return {Boolean} 如果是则返回true.
 */
V.isArrayLike = function(o) {
    var type = V.typeOf(o);
    return type === 'array' || type === 'object' && typeof o.length === 'number';
};

/**
 * 测试给定对象是否为数值，如 1, '1', 1.24, '20'.
 * @method isNumeric
 * @param {*} value 要检测的对象.
 * @return {Boolean} 如果是则返回true.
 */
V.isNumeric = function(value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
};

/**
 * 测试给定对象是否为number类型.
 * @method isNumber
 * @param {*} val 要检测的对象.
 * @return {Boolean} 如果是则返回true.
 */
V.isNumber = function(val) {
    return typeof val === 'number' && isFinite(val);
};

/**
 * 测试给定对象是否为javascript对象.
   Array和Function、Null同样是对象，如果要具体判断请使用相关判断方法.
 * @method isObject
 * @param {*} obj 要检测的对象.
 * @return {Boolean} 如果是则返回true.
 */
V.isObject = function(obj) {
    var type = V.typeOf(obj);
    return type === 'object' && obj != null || type === 'function';
};

/**
 * 测试对象是否是纯粹的对象（通过 "{}" 或者 "new Object" 创建的）.
 * @method isPlainObject
 * @param {Object} obj 要测试的对象.
 * @return {Boolean} 如果是则返回true.
 */
V.isPlainObject = function(obj) {
    // Must be an Object.
    // Because of IE, we also have to check the presence of the constructor property.
    // Make sure that DOM nodes and window objects don't pass through, as well
    if (!obj || V.typeOf(obj) !== 'object' || obj.nodeType || obj.window == obj) {
        return false;
    }

    try {
        // Not own constructor property must be Object
        if (obj.constructor &&
            !HASOWN(obj, "constructor") &&
            !HASOWN(obj.constructor.prototype, "isPrototypeOf")) {
            return false;
        }
    } catch (e) {
        // IE8,9 Will throw exceptions on certain host objects #9897
        return false;
    }

    // Own properties are enumerated firstly, so to speed up,
    // if last one is own, then all properties are own.

    var key;
    for (key in obj) {}

    return key === undefined || HASOWN(obj, key);
};

/**
 * 判断给定的值是否为空，针对以下几种情况：
 * - 'null'
 * - 'undefined'
 * - array.length === 0
 * - string.length === 0
 * - {} 空对象
 * @method isEmpty
 * @param {Object} obj 要检测的对象.
 * @return {Boolean} 返回检测结果，true则为空.
 */
V.isEmpty = function(obj) {
    var ret = false;

    if (obj === null || obj === undefined || obj === ''
        || (V.isArray(obj) && obj.length === 0)) {
        return true;
    } else if (V.isPlainObject(obj)) {
        for (var key in obj) {
            ret = key;
            return false;
        }

        ret = true;
    }

    return ret;
};

/**
 * @module GR
 * @submodule GR-lang
 */
var ENUM_BUG = !({toString: 1}.propertyIsEnumerable('toString')),
    ENUMERABLES = ['hasOwnProperty', 'valueOf', 'isPrototypeOf', 'propertyIsEnumerable',
                   'toLocaleString', 'toString', 'constructor'];

/**
 * 遍历对象属性或数组.
 * @method each
 * @for gr
 * @param {Object|Array} obj 要操作的对象.
 * @param {Function} fn 遍历处理函数.
 * @param {Object} scope 上下文指针.
 * @return {Object} gr.
 * @example
 * gr.each({k1:v1, k2:v2, k3:v3}, function(value, key){
        key ==> k1, k2, k3;
        value ==> v1, v2, v3;
   });
 */
V.each = function(obj, fn, scope) {
    if (obj) {
        scope = scope || HOST;

        if (V.isArrayLike(obj)) {
            for (var i = 0, val = obj[0], len = obj.length;
                i < len && fn.call(scope, val, i) !== false; val = obj[++i]) {}
        } else {
            for (var key in obj) {
                if (!ENUM_BUG || OP[key] === undefined) {
                    if (fn.call(scope, obj[key], key) === false) break;
                }
            }

            if (ENUM_BUG) {
                for (key in OP) {
                    if (HASOWN(obj, key) || obj[key] !== OP[key]) {
                        if (fn.call(scope, obj[key], key) === false) break;
                    }
                }
            }
        }
    }

    return V;
};

/**
 * 拷贝源的属性到目标上
 * @method mix
 * @param {Object} receiver 目标对象.
 * @param {Object} supplier 源对象.
 * @param {Boolean} overwrite 是否覆盖相同属性.
 * @param {String[]} whitelist 也可以列举要覆盖的属性列表.
 * @param {Boolean} deep 是否深度mix.
 * @return {Object} receiver.
 */
V.mix = function(receiver, supplier, overwrite, whitelist, deep) {
    if (!receiver || !supplier) {
        return receiver || V;
    }

    var key, isObject = V.isObject, hasRK,
        hasWhite = whitelist && whitelist.length;

    V.each(hasWhite ? whitelist : supplier, function(val, k) {
        key = hasWhite ? val : k;

        if (!HASOWN(supplier, key)) {
            return true;
        }

        hasRK = key in receiver;

        if (deep && hasRK && isObject(supplier[key]) && isObject(receiver[key])) {
            V.mix(receiver[key], supplier[key], overwrite, null, deep);
        } else if (overwrite || !hasRK) {
            receiver[key] = supplier[key];
        }
    });

    if (!hasWhite && ENUM_BUG) {
        V.mix(receiver, supplier, overwrite, ENUMERABLES, deep);
    }

    return receiver;
};

/**
 * Object.
 * @class Obejct
 */
V.Object = {
    /**
     * 检测是否有enum bug，若有则使用enumerables循环检测.
     * @property _enumBug
     * @type {Boolean}
     * @private
     */
    _enumBug: ENUM_BUG,

    /**
     * fixes IE non-enumerable bug.
     * @property _enumerables
     * @type {Null|Array}
     * @private
     */
    _enumerables: ENUMERABLES,

    /**
     * 根据给定的对象，创建一个对象，使之原型链指向给定的对象.
     * @method create
     * @param {Object} obj 给定的prototype对象.
     * @return {Object} 返回prototype为obj的对象.
     */
    create: V._isNative(Object.create) ? function(obj) {
        return Object.create(obj);
    } : (function() {
        function F() {}

        return function(obj) {
            F.prototype = obj;
            return new F();
        };
    }()),

    /**
     * hasOwnProperty的封装.
     * @method hasOwn
     * @param {Object} obj 要检测的对象.
     * @param {String} key 键名.
     * @return {Boolean} 若有则返回true.
     */
    hasOwn: function (obj, key) {
        return !!obj && HASOWN(obj, key);
    },

    /**
     * 获得Object所有的key的集合.
     * @example
     *      gr.Object.getKeys({a: 1, b: 2, c: 3}) ==> ['a', 'b', 'c']
     * @method getKeys
     * @param {Object} obj 要处理的对象.
     * @return {String[]} 包含obj所有key的数组.
     */
    getKeys: V._isNative(Object.keys) ? Object.keys : function(obj) {
        var keys = [],
            key;

        for (key in obj) {
            if (HASOWN(obj, key)) {
                keys.push(key);
            }
        }

        if (ENUM_BUG) {
            for (var i = 0, len = ENUMERABLES.length; i < len; ++i) {
                key = ENUMERABLES[i];
                if (HASOWN(obj, key)) {
                    keys.push(key);
                }
            }
        }

        return keys;
    },

    /**
     * 获得Object所有的value的集合.
     * @example
     *      gr.Object.getValues({a: 1, b: 2, c: 3}) ==> [1, 2, 3]
     * @method getValues
     * @param {Object} obj 要处理的对象.
     * @return {Array} 包含obj所有value的集合.
     */
    getValues: function(obj) {
        var res = [],
            keys = this.getKeys(obj);

        for (var i = 0, len = keys.length; i < len; ++i) {
            res.push(obj[keys[i]]);
        }

        return res;
    },

    /**
     * 根据value查找key.
     * @method getKeyByVal
     * @param {Object} obj 要处理的对象.
     * @param {*} val 值.
     * @return {String} 如果找到返回key，否返回undefined.
     */
    getKeyByVal: function(obj, val) {
        for (var key in obj) {
            if (HASOWN(obj, key) && obj[key] === val) {
                return key;
            }
        }

        return undefined;
    },

    /**
     * 根据keys查找value集合.
     * @method getValByKeys
     * @param {Object} obj 要处理的对象.
     * @param {Array} keys 关键字集合.
     * @return {Array} 查找的value集合.
     */
    getValByKeys: function(obj, keys) {
        keys = keys || [];
        var i, len = keys.length,
            key,
            vals = [];

        for (i = 0; i < len; ++i) {
            key = keys[i];

            if (key in obj && HASOWN(obj, key)) {
                vals.push(obj[key]);
            }
        }

        return vals;
    },

    /**
     * 检测某个对象是否包含给定的key.
     * @method containsKey
     * @param {Object} obj 要处理的对象.
     * @param {*} key 关键字.
     * @return {Boolean} true则存在.
     */
    containsKey: function(obj, key) {
        return key in obj;
    },

    /**
     * 检测对象是否包含某个value.
     * @method containsVal
     * @param {Object} obj 要处理的对象.
     * @param {*} val 值.
     * @return {Boolean} 如果找到返回true.
     */
    containsVal: function(obj, val) {
        var key = this.getKeyByVal(obj, val);
        return V.isDefined(key) ? true : false;
    },

    /**
     * 获取Object里key-value对的个数
     * @param {Object} obj 要处理的对象.
     * @return {Number} obj键值对的个数.
     */
    getCount: function(obj) {
        return this.getKeys(obj).length;
    },

    /**
     * 过滤对象.
     * @method filter
     * @param {Object} obj 要过滤的对象.
     * @param {Function} fn 过滤函数，该函数只接受2个参数，fn(value, key).
     * @param {Object} scope 函数call时的this指针.
     * @return {Object} 过滤后的对象.
     */
    filter: function(obj, fn, scope) {
        var res = {};

        V.each(obj, function(val, key) {
            if (fn.call(this, val, key)) {
                res[key] = val;
            }
        }, scope);

        return res;
    },

    /**
     * 对象map.
     * @method map
     * @param {Object} obj 要处理的对象.
     * @param {Function} fn map函数，该函数只接受2参数，fn(value, key).
     * @param {Object} scope 函数call时的this指针.
     * @return {Object} map后的对象.
     */
    map: function(obj, fn, scope) {
        var res = {};

        V.each(obj, function(val, key) {
            res[key] = fn.call(this, val, key);
        }, scope);

        return res;
    },

    /**
     * 对象是否有一个符合fn，如果有一则返回true，都没则返回false.
     * @method some
     * @param {Object} obj 要处理的对象.
     * @param {Function} fn 检测函数，该函数只接受3参数，fn(value, key, obj).
     * @param {Object} scope 函数call时的this指针.
     * @return {Boolean} 如果有一个成立则返回true，否则false.
     */
    some: function(obj, fn, scope) {
        scope = scope || HOST;

        for (var key in obj) {
            if (HASOWN(obj, key)) {
                if (fn.call(scope, obj[key], key, obj)) {
                    return true;
                }
            }
        }

        return false;
    },

    /**
     * 对象是否全部符合fn，如果有一不符合则返回false.
     * @method every
     * @param {Object} obj 要处理的对象.
     * @param {Function} fn 检测函数，该函数只接受3参数，fn(value, key, obj).
     * @param {Object} scope 函数call时的this指针.
     * @return {Boolean} 如果有一个不成立则返回false，否则true.
     */
    every: function(obj, fn, scope) {
        scope = scope || HOST;

        for (var key in obj) {
            if (HASOWN(obj, key)) {
                if (!fn.call(scope, obj[key], key, obj)) {
                    return false;
                }
            }
        }

        return true;
    },

    /**
     * 移除一对key-value，通过key判断.
     * @method remove
     * @param {Object} obj 要处理的对象.
     * @param {*} key 要移除的key.
     * @return {Boolean} 返回元素是否被删除.
     */
    remove: function(obj, key) {
        var dlt = this.containsKey(obj, key);

        if (dlt) {
            delete obj[key];
        }

        return dlt;
    },

    /**
     * 通过value删除键值对.
     * @method removeByVal
     * @param {*} val 值.
     * @return {Boolean} 返回元素是否被删除.
     */
    removeByVal: function(obj, val) {
        var key = this.getKeyByVal(obj, val);

        if (key !== undefined) {
            return this.remove(obj, key);
        }
        return false;
    },

    /**
     * 清空对象.
     * @method clear
     * @param {Object} obj 要处理的对象.
     */
    clear: function(obj) {
        for (var i in obj) {
            delete obj[i];
        }
    },

    /**
     * 将一键值对转化为记录集结构.
     * @example
           var objects = gr.Object.toQueryObj('hobbies', ['reading', 'cooking', 'swimming']);

           // objects then equals:
           [
               { name: 'hobbies', value: 'reading' },
               { name: 'hobbies', value: 'cooking' },
               { name: 'hobbies', value: 'swimming' },
           ];

           var objects = gr.Object.toQueryObj('dateOfBirth', {
               day: 3,
               month: 8,
               year: 1987,
               extra: {
                   hour: 4,
                   minute: 30
               }
           }, true); // Recursive

           // objects then equals:
           [
               { name: 'dateOfBirth[day]', value: 3 },
               { name: 'dateOfBirth[month]', value: 8 },
               { name: 'dateOfBirth[year]', value: 1987 },
               { name: 'dateOfBirth[extra][hour]', value: 4 },
               { name: 'dateOfBirth[extra][minute]', value: 30 },
           ];
     *
     * @param {String} name 关键字.
     * @param {Object/Array} value 值.
     * @param {Boolean} [recursive=false] 是否深度转化.
     * @return {Array} 返回结构化的数组.
     */
    toQueryObj: function(name, value, recursive) {
        var ret = [];

        if (V.isArray(value) || V.isPlainObject(value)) {
            V.each(value, function(n, i) {
                if (recursive) {
                    ret = ret.concat(this.toQueryObj(name + '[' + i + ']', n, true));
                } else {
                    ret.push({name: name, value: n});
                }
            }, this);
        } else {
            ret.push({name: name, value: value});
        }

        return ret;
    },

    /**
     * 序列化对象（参考Ext）.
     * @method param
     *
     * Non-recursive:
     *
           gr.Object.param({foo: 1, bar: 2}); // returns "foo=1&bar=2"
           gr.Object.param({foo: null, bar: 2}); // returns "foo=&bar=2"
           gr.Object.param({'some price': '$300'}); // returns "some%20price=%24300"
           gr.Object.param({colors: ['red', 'green', 'blue']}); // returns "colors=red&colors=green&colors=blue"
     *
     * Recursive:
     *
           gr.Object.param({
               username: 'Jacky',
               dateOfBirth: {
                   day: 1,
                   month: 2,
                   year: 1911
               },
               hobbies: ['coding', 'eating', 'sleeping', ['nested', 'stuff']]
           }, true); // returns the following string (broken down and url-decoded for ease of reading purpose):
           // username=Jacky
           //    &dateOfBirth[day]=1&dateOfBirth[month]=2&dateOfBirth[year]=1911
           //    &hobbies[0]=coding&hobbies[1]=eating&hobbies[2]=sleeping&hobbies[3][0]=nested&hobbies[3][1]=stuff
     *
     * @param {Object} object The object to encode
     * @param {Boolean} [recursive=false] Whether or not to interpret the object in recursive format.
     * (PHP / Ruby on Rails servers and similar).
     * @param {Boolean} [recursive=false] 是否递归深度处理.
     * @param {String} sep 字符串分隔符，默认‘&’.
     * @param {String} eq 键值对分隔符，默认‘=’.
     * @return {String} queryString
     */
    param: function(o, recursive, sep, eq) {
        sep = sep || '&';
        eq = eq || '=';
        var paramObjects = [],
            params = [],
            encode = encodeURIComponent,
            value;

        V.each(o, function(v, key) {
            paramObjects = paramObjects.concat(V.Object.toQueryObj(key, v, recursive));
        });

        V.each(paramObjects, function(n) {
            value = n.value;

            if (V.isEmpty(value)) {
                value = '';
            }
            else if (V.isDate(value)) {
                value = value.getTime();
            }

            params.push(encode(n.name) + '=' + encode(String(value)));
        });

        return params.join('&');
    }
};

/**
 * alias for gr.Object.param.
 * @method param
 * @for gr
 */
V.param = V.Object.param;
/**
 * @module GR
 * @submodule GR-lang
 */

var AP = Array.prototype,
    SLICE = AP.slice;

/**
 * Array.
 * @class Array
 */
V.Array = {
    /**
     * 判断一元素是否在一个数组中.
     * @method indexOf
     * @param {Array} array 要处理的数组.
     * @param {*} item 要验证的元素.
     * @param {Number} from 从from位置开始查找.
     * @return {Number} 返回是否存在数组当中，若有返回数组中的位置，否则返回-1.
     */
    indexOf: V._isNative(AP.indexOf) ?
        function(array, item, fromIndex) {
            return AP.indexOf.call(array, item, fromIndex);
        } :
        function(array, item, fromIndex) {
            for (var
                i = (fromIndex < 0) ? Math.max(0, len + fromIndex) : fromIndex || 0,
                 len = array.length; i < len; ++i) {
                if (array[i] === item) {
                    return i;
                }
            }

            return -1;
    },

    /**
     * 判断一元素是否在一个数组中（从末尾开始找）.
     * @method lastIndexOf
     * @param {Array} array 要处理的数组.
     * @param {*} item 要验证的元素.
     * @param {Number} from 从from位置开始查找.
     * @return {Number} 返回是否存在数组当中，若有返回数组中的位置，否则返回-1.
     */
    lastIndexOf: V._isNative(AP.lastIndexOf) ?
        function(array, item, fromIndex) {
            return AP.lastIndexOf.call(array, item, fromIndex);
        } :
        function(array, item, fromIndex) {
            var i, len = array.length;

            if (fromIndex) {
                if (!V.isNumber(fromIndex)) {
                    fromIndex = 0;
                } else if (fromIndex !== 0) {
                    fromIndex = (fromIndex > 0 || -1) * Math.floor(Math.abs(fromIndex));
                }
            } else {
                fromIndex = len;
            }

            i = fromIndex >= 0 ? Math.min(fromIndex, len - 1) : len + fromIndex;

            for (; i >= 0; --i) {
                if (i in array && array[i] === item) {
                    return i;
                }
            }

            return -1;
    },

    /**
     * 判断某个元素是否在数组中.
     * @method contains
     * @param {Array} arr 要判断的数组.
     * @param {*} item 要检测的元素.
     * @return {Boolean} 如果存在返回true，否则false.
     */
    contains: function(arr, item) {
        return V.Array.indexOf(arr, item) > -1;
    },

    /**
     * 移除数组元素，改变原数组.
     * @method remove
     * @param {Array} arr 要处理的数组.
     * @param {String|Number} item 要移除的元素.
     * @return {Boolean} 成功移除返回true.
     */
    remove: function(arr, item) {
        var index = V.Array.indexOf(arr, item);

        if (index != -1) {
            V.Array.removeAt(arr, index);
            return true;
        }

        return false;
    },

    /**
     * 移除给定索引的数组元素，改变原数组.
     * @method removeAt
     * @param {Array} arr 要处理的数组.
     * @param {Number} index 要移除的元素的索引.
     * @return {Boolean|Array} 成功移除返回被删除的元素的数组.
     */
    removeAt: function(arr, index) {
        if (index >= 0) {
            return AP.splice.call(arr, index, 1);
        }

        return false;
    },

    /**
     * 数组是否有一个符合fn，如果有一则返回true，都没则返回false.
     * @method some
     * @param {Array} arr 要处理的对象.
     * @param {Function} fn 检测函数，该函数只接受3参数，fn(value, index, arr).
     * @param {Object} scope 函数call时的this指针.
     * @return {Boolean} 如果有一个成立则返回true，否则false.
     */
    some: V._isNative(AP.some) ?
        function(arr, fn, scope) {
            return AP.some.call(arr, fn, scope);
        } :
        function(arr, fn, scope) {
            for (var i = 0, len = arr.length; i < len; ++i) {
                if (i in arr && fn.call(scope, arr[i], i, arr)) {
                    return true;
                }
            }

            return false;
    },

    /**
     * 对象是否全部符合fn，如果有一不符合则返回false.
     * @method every
     * @param {Array} arr 要处理的对象.
     * @param {Function} fn 检测函数，该函数只接受3参数，fn(value, index, arr).
     * @param {Object} scope 函数call时的this指针.
     * @return {Boolean} 如果有一个不成立则返回false，否则true.
     */
    every: V._isNative(AP.every) ?
        function(arr, fn, scope) {
            return AP.every.call(arr, fn, scope);
        } :
        function(arr, fn, scope) {
            for (var i = 0, len = arr.length; i < len; ++i) {
                if (i in arr && !fn.call(scope, arr[i], i, arr)) {
                    return false;
                }
            }
            return true;
    },

    /**
     * 根据给定的条件，返回第一个符合条件的元素的索引，未找到返回-1.
     * @method findIndex
     * @param {Array} arr 要处理的对象.
     * @param {Function} fn 检测函数，该函数只接受3参数，fn(value, index, arr).
     * @param {Object} scope 函数call时的this指针.
     * @return {Number} 返回第一个符合条件的元素的索引，否则返回-1.
     */
    findIndex: function(arr, fn, scope) {
        var len = arr.length,
            i = 0;

        for (; i < len; ++i) {
            if (i in arr && fn.call(scope, arr[i], i, arr)) {
                return i;
            }
        }

        return -1;
    },

    /**
     * 移除数组中重复的元素，并返回含唯一元素的新数组，不改变原数组.
     * @method unique
     * @param {Array} array 要处理的数组.
     * @return {Array} 返回元素唯一的新数组.
     */
    unique: function(array) {
        var tmp = {},
            clone = [],
            i = 0,
            len = array.length,
            t;

        for (; i < len; ++i) {
            t = array[i];

            if (!tmp[t]) {
                clone.push(t);
            }

            tmp[t] = true;
        }
        tmp = null;

        return clone;
    },

    /**
     * 过滤数组.
     * @method filter
     * @param {Array} arr 要处理的数组.
     * @param {Function} fn 过滤条件函数，注意：fn(value, key, arr).
     * @param {Object} scope 函数call时的this指针.
     * @return {Array} 返回过滤后的新数组.
     */
    filter: V._isNative(AP.filter) ?
        function(arr, fn, scope) {
            return AP.filter.call(arr, fn, scope);
        } :
        function(arr, fn, scope) {
            var ret = [];

            V.each(arr, function(item, i) {
                if (fn.call(scope, item, i, arr)) {
                    ret.push(item);
                }
            });

            return ret;
    },

    /**
     * 数组map.
     * @method map
     * @param {Object} obj 要处理的数组.
     * @param {Function} fn map函数，该函数只接受3个参数，fn(val, i, arr).
     * @param {Object} scope 函数call时的this指针.
     * @return {Object} map后的新数组.
     */
    map: V._isNative(AP.map) ?
        function(arr, fn, scope) {
            return AP.map.call(arr, fn, scope);
        } :
        function(arr, fn, scope) {
            var ret = [];

            V.each(arr, function(item, i) {
                ret[i] = fn.call(scope, item, i, arr);
            });

            return ret;
    },

    /**
     * 遍历数组.
     * @method forEach
     * @param {Object} obj 要处理的数组.
     * @param {Function} fn 遍历函数，该函数只接受3个参数，fn(val, i, arr).
     * @param {Object} scope 函数call时的this指针.
     * @return {Object} gr.Array.
     */
    forEach: V._isNative(AP.forEach) ? function(arr, fn, scope) {
        return AP.forEach.call(arr, fn, scope);
    } : function(arr, fn, scope) {
        for (var i = 0, len = arr.length; i < len; ++i) {
            fn.call(scope, arr[i], i, arr);
        }

        return this;
    },

    /**
     * 将对象的值集合转为数组.
     * @method toArray
     * @param {ArrayLike} obj 要处理的对象.
     * @return {Array} 返回转化后的数组.
     */
    toArray: function(obj) {
        if (!obj) {
            return [];
        }
        if (V.isArray(obj)) {
            return SLICE.call(obj);
        }
        if (obj.toArray && V.isFunction(obj.toArray)) {
            return obj.toArray();
        }
        return V.Object.getValues(obj);
    },

    /**
     * 将对象转为数组.
     * @method makeArray
     * @param {Array|Object} o 要操作的对象.
     * @return {Array} 返回转化后的数组.
     */
    makeArray: function(o) {
        var type,
            ret = [];

        if (o != null) {
            type = V.typeOf(o);
            if (o.length == null || type === "string" || type === "function"
             || type === "regexp" || o == o.window) {
                return [o];
            } else {
                for (var i = 0, l = o.length; i < l; ++i) {
                    ret[i] = o[i];
                }
            }
        }

        return ret;
    },

    /**
     * 将多个数组同一位置的元素各组合成一个新数组，最后返回所有组合元素组成的数组，且以
     * 数组长度最小的为参考，超过最小长度的元素将被忽略.
     * @method zip
     * @example
     *      gr.Array.zip([1,2,3], [2,3,4,5]);
     *      // => [[1,2], [2,3], [3,4]]，第二个数组的第4个元素将被忽略
     * @param {Array...} var_args 多个数组.
     * @return {Array} 返回组合的结果数组.
     */
    zip: function() {
        var args = SLICE.call(arguments), len;

        if (!(len=args.length)) {
            return [];
        }

        var result = [], i, j, arr;

        for (i = 0; true; ++i) {
            var val = [];
            for (j = 0; j < len; ++j) {
                arr = args[j];
                if (i >= arr.length) {
                    return result;
                }
                val.push(arr[i]);
            }
            result.push(val);
        }

        return result;
    },

    /**
     * 返回一个扁平化的数组.
     * @method flatten
     * @example
     *      gr.Array.flatten([1, [2, 3], 4])
     *      // => [1, 2, 3, 4]
     * @param {...*} var_args 要扁平化的数组.
     * @return {Array} 返回扁平化的数组.
     */
    flatten: function() {
        var result = [],
            i = 0, element,
            args = SLICE.call(arguments),
            len = args.length;

        for (; i < len; ++i) {
            element = args[i];

            if (V.isArray(element)) {
                result.push.apply(result, V.Array.flatten.apply(null, element));
            } else {
                result.push(element);
            }
        }

        return result;
    },

    /**
     * 返回一个对象，它使用第一个数组做为keys，第二个数组为对应的values
     * 如果第二个数组没提供或者第二个数组的长度小于第一个，则没对齐的位置的values为true.
     * @method hash
     * @example
        gr.Array.hash(['a', 'b', 'c'], ['foo', 'bar']);
        // => {a: 'foo', b: 'bar', c: true}
     * @param {String[]} keys 字符串数组，将作为keys.
     * @param {Array} [values] 第二个数组，将对齐作为values.
     * @param {*} defV 给第一个数组未对齐的位置赋值，默认为true.
     * @return {Object} 返回对齐后的对象.
     */
    hash: function (keys, values, defV) {
        var hash = {},
            vlen = (values && values.length) || 0,
            i = 0, len = keys.length;

        defV = defV || true;

        for (; i < len; ++i) {
            if (i in keys) {
                hash[keys[i]] = vlen > i && i in values ? values[i] : defV;
            }
        }

        return hash;
    },

    /**
     * 根据给定的函数，并通过传递初始值和数组的每一个元素，计算结果.
     * @method reduce
     * @param {Array} 要计算的数组.
     * @param {Function} callback 计算函数.
     * @param {*} initialValue 初始值，用于callback第一次调用.
     * @return {*} 返回计算结果.
     */
    reduce: V._isNative(AP.reduce) ? function(arr, callback, initialValue) {
        return AP.reduce.call(arr, callback, initialValue);
    } : function(arr, callback, initialValue) {
        var rs = initialValue;

        V.Array.forEach(arr, function(val, index) {
            rs = callback(rs, val, index, arr);
        });

        return rs;
    },

    /**
     * 根据给定的函数，并通过传递初始值和数组的每一个元素，计算结果（从右向左计算）.
     * @method reduceRight
     * @param {Array} 要计算的数组.
     * @param {Function} callback 计算函数.
     * @param {*} initialValue 初始值，用于callback第一次调用.
     * @return {*} 返回计算结果.
     */
    reduceRight: V._isNative(AP.reduceRight) ? function(arr, callback, initialValue) {
        return AP.reduceRight.call(arr, callback, initialValue);
    } : function(arr, callback/*, initialValue*/) {
        var len = arr.length,
            k = len - 1,
            accumulator;

        if (arguments.length >= 3) {
            accumulator = arguments[1];
        } else {
            do {
                if (k in arr) {
                  accumulator = arr[k--];
                  break;
                }

                // if array contains no values, no initial value to return
                if (--k < 0) {
                  throw new TypeError();
                }
            }
            while (true);
        }

        while (k >= 0) {
            if (k in arr) {
                accumulator = callback.call(undefined, accumulator, arr[k], k, arr);
            }
            k--;
        }

        return accumulator;
    }
};
/**
 * @module GR
 * @submodule GR-lang
 */

var CAMEL_RE = /\-([a-z])/ig,
    EMPTY = '',
    BLANK = ' ',
    SUBS_RE = /\\?\{(\w+)\}/gm,
    STRINGPRO = String.prototype,
    _charToEntity = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
        '`': '&#x60;'
    },
    _entityKeys = V.Object.getKeys(_charToEntity),
    _entityValues = V.Object.getValues(_charToEntity),
    escapeRe = new RegExp('(' + _entityKeys.join('|') + ')', 'g'),
    unEscapeRe = new RegExp('(' + _entityValues.join('|') + '|&#[0-9]{1,5};' + ')', 'g'),
    escapeRegExpRe = /[\-#$\^*()+\[\]{}|\\,.?\s]/g,
    _entityToChar;

// get convert entity
_entityToChar = V.Array.hash(_entityValues, _entityKeys);

function compareElements_(v1, v2) {
    if (v1 < v2) {
        return -1;
    } else if (v1 > v2) {
        return 1;
    }

    return 0;
}

/**
 * String Util.
 * @class String
 */
V.String = {
    /**
     * 字符串填白.
     * @method leftPad
     * @param {String} str 要处理的字符串.
     * @param {Number} len 判断要填白的长度条件.
     * @param {String} chfill 当字符串长度小于len时，要填的字符.
     * @return {String} 返回填白处理后的字符串.
     */
    leftPad: function(str, len, chfill) {
        var result = String(str) || EMPTY;

        chfill = chfill || BLANK;

        while (result.length < len) {
            result = chfill + result;
        }

        return result;
    },

    /**
     * 获取字符串的真实长度.
     * @method getRealLen
     * @param {String} str 要处理的字符串.
     * @param {Boolean} isUTF8 是否是utf-8编码.
     * @return {Number} 返回字符串的实际长度.
     */
    getRealLen: function(str, isUTF8) {
        if (typeof str !== 'string') {
            return 0;
        }

        if (!isUTF8) {
            return str.replace(/[^\x00-\xFF]/g, '**').length;
        } else { // utf-8 chinese 3bytes
            var cc = str.replace(/[\x00-\xFF]/g, '');
            return (str.length - cc.length) + (encodeURI(cc).length / 3);
        }
    },

    /**
     * 截取字符串.
     * @method truncate
     * @param {String} str 要处理的字符串.
     * @param {Number} len 要截取的长度.
     * @param {String} tails 超过指定长度后填充的字符.
     * @return {String} 返回截取后的字符串.
     */
    truncate: function(str, len, tails) {
        str += EMPTY;
        tails = tails || EMPTY;

        var strLen = str.length,
            i = Math.min(Math.floor(len / 2), strLen),
            cnt = V.String.getRealLen(str.slice(0, i));

        for (; i < strLen && cnt < len; ++i) {
            cnt += 1 + !/[\x00-\xFF]/.test(str.charAt(i));
        }

        return str.slice(0, cnt > len ? i - 1 : i) + (i < strLen ? tails : EMPTY);
    },

    /**
     * 版本比较，主要用于浏览器版本判断.
     * @method compareVersions
     * @param {String} version1 版本1.
     * @param {String} version2 版本2.
     * @return {Number} 返回判断结果，-1(v1<v2)，1(v1>v2)，0(v1=v2).
     */
    compareVersions: function(version1, version2) { // google closure
        var trim = V.String.trim,
            v1, v2, maxLen,
            result = 0,
            i;

        if (version1 === version2) {
            return result;
        }

        v1 = trim(version1 + EMPTY).split('.');
        v2 = trim(version2 + EMPTY).split('.');

        for (i = 0, maxLen = Math.max(v1.length, v2.length); result === 0 && i < maxLen; ++i) {
            var v1sub = v1[i] + EMPTY,
                v2sub = v2[i] + EMPTY,
                v1CompParser = new RegExp('(\\d*)(\\D*)', 'g'),
                v2CompParser = new RegExp('(\\d*)(\\D*)', 'g');

            do {
                var v1Comp = v1CompParser.exec(v1sub) || ['', '', ''],
                    v2Comp = v2CompParser.exec(v2sub) || ['', '', ''];

                if (v1Comp[0].length === 0 && v2Comp[0].length === 0) {
                    break;
                }

                var v1CompNum = v1Comp[1].length === 0 ? 0 : parseInt(v1Comp[1], 10),
                    v2CompNum = v2Comp[1].length === 0 ? 0 : parseInt(v2Comp[1], 10);

                result = compareElements_(v1CompNum, v2CompNum) ||
                    compareElements_(v1Comp[2].length === 0, v2Comp[2].length === 0) ||
                    compareElements_(v1Comp[2], v2Comp[2]);
            } while (result === 0);
        }

        return result;
    },

    /**
     * 根据给定的json或array，替换字符串（对于高级的可使用模板引擎）.
     * @method subs
     * @example
     *      var str = gr.String.subs('<div id="{id}" class="{cls}"></div>', {id:'xx', cls:'red'});
     *      // => str = '<div id="xx" class="red"></div>';
     * @param {String} str 要替换的字符串.
     * @param {Object} [data] 替换数据源，通常为json.
     * @param {RegExp} re 正则表达式用于匹配.
     * @return {String} 返回替换后的字符串.
     */
    subs: function(str, data, re) {
        if (typeof str != 'string' || !data) {
            return str;
        }

        return str.replace(re || SUBS_RE, function (match, name) {
            if (match.charAt(0) === '\\') {
                return match.slice(1);
            }
            return (data[name] === undefined) ? EMPTY : data[name];
        });
    },

    /**
     * 全角字符转半角字符
                        全角空格为12288，转化成" "；
                        全角句号为12290，转化成"."；
                        其他字符半角(33-126)与全角(65281-65374)的对应关系是：均相差65248
     * @method dbc2sbc
     * @param {String} s 需要处理的字符串.
     * @return {String} 返回转化后的字符串.
     */
    dbc2sbc: function(str) {
        str += EMPTY;
        return str.replace(/[\uff01-\uff5e]/g, function(a) {
            return String.fromCharCode(a.charCodeAt(0) - 65248);
        }).replace(/\u3000/g, ' ').replace(/\u3002/g, '.');
    },

    /**
     * 判断一字符串中是否存在指定的子串.
     * @method contains
     * @param {String} str 父字符串.
     * @param {String} s 要判断是否存在的子串.
     * @return {Boolean} 返回存在与否.
     */
    contains: function(str, s) {
        return str.indexOf(s) != -1;
    },

    /**
     * 字符串首字母大写.
     * @method capitalFirst
     * @param {String} str 要处理的字符串.
     * @return {String} 返回首字符大写的字符串.
     */
    capitalFirst: function(str) {
        str += EMPTY;
        return str.charAt(0).toUpperCase() + str.substring(1);
    },

    /**
     * 将以‘-’连接的字符串转为驼峰形式.
     * @method toCamelCase
     * @example
     *      gr.String.toCamelCase('border-width') => 'borderWidth'
     * @param {String} str 待处理的字符串.
     * @return {String} 返回驼峰形式的结果.
     */
    toCamelCase: function(str) {
        str += EMPTY;
        return str.replace(CAMEL_RE, function(all, match) {
            return match.toUpperCase();
        });
    },

    /**
     * 判断一字符串是否以prefix开头.
     * @method startsWith
     * @param {String} str 被检测的字符串.
     * @param {String} prefix 要检测的开头部分.
     * @return {Boolean} 返回是否存在prefix.
     */
    startsWith: function(str, prefix) {
        return str.lastIndexOf(prefix, 0) === 0;
    },

    /**
     * 判断一字符串是否以suffix结尾.
     * @method endsWidth
     * @param {String} str 被检测的字符串.
     * @param {String} suffix 要检测的结尾部分.
     * @return {Boolean} 返回是否存在suffix.
     */
    endsWith: function(str, suffix) {
        return str.slice(-suffix.length) === suffix;
    },

    /**
     * 去除字符串的首尾空格.
     * @method trim
     * @param {String} str 要处理的字符串.
     * @return {String} 返回去除首尾空格的字符串.
     */
    trim: STRINGPRO.trim ? function(str) {
        return str && str.trim ? str.trim() : str;
        } : function(str) {
        return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, '');
    },

    /**
     * 去除字符串的全部空格.
     * @method trimAll
     * @param {String} str 要处理的字符串.
     * @return {String} 返回去除全部空格的字符串.
     */
    trimAll: function(str) {
        return str.replace(/[\s\xa0]+/g, '');
    },

    /**
     * 去除字符串的头部空格.
     * @method trimLeft
     * @param {String} str 要处理的字符串.
     * @return {String} 返回去除头部空格的字符串.
     */
    trimLeft: STRINGPRO.trimLeft ? function(str) {
        return str.trimLeft();
    } : function(str) {
        return str.replace(/^[\s\xa0]+/g, '');
    },

    /**
     * 去除字符串的尾部空格.
     * @method trimRight
     * @param {String} str 要处理的字符串.
     * @return {String} 返回去除尾部空格的字符串.
     */
    trimRight: STRINGPRO.trimRight ? function(str) {
        return str.trimRight();
        } : function(str) {
        return str.replace(/[\s\xa0]+$/g, '');
    },

    /**
     * 判断字符串是否纯字母组成.
     * @method isAlpha
     * @param {String} str 要检测的字符串.
     * @return {Boolean} 如果是则返回true.
     */
    isAlpha: function(str) {
        return !/[^a-zA-Z]/.test(str);
    },

    /**
     * 判断字符串是纯数字字符串.
     * @method isNumeric
     * @param {String} str 要检测的字符串.
     * @return {Boolean} 如果是则返回true.
     */
    isNumeric: function(str) {
        return !/[^0-9]/.test(str);
    },

    /**
     * html encode
     *      & < > " ' / `
     * @method htmlEncode
     * @param {String} html the html to encode.
     * @return {String} the result.
     */
    htmlEncode: function(str) {
        return (str + EMPTY).replace(escapeRe, function(match, capture) {
            return _charToEntity[capture];
        });
    },

    /**
     * html encode.
     * @method htmlEncode
     * @param {String} html the html to encode.
     * @return {String} the result.
     */
    htmlDecode: function(str) {
        return (str + EMPTY).replace(unEscapeRe, function(match, capture) {
            return _entityToChar[capture] || String.fromCharCode(parseInt(capture.substr(2), 10));
        });
    },

    /**
     * 在为url添加参数时判断是否已经存在‘?’，若存在则添加‘&’.
     * @method urlAdd
     * @param {String} url the url to test.
     * @param {String} string the params to add.
     * @return {String} new url.
     */
    urlAdd: function(url, string) {
        if (!V.isEmpty(string)) {
            return url + (url.indexOf('?') === -1 ? '?' : '&') + string;
        }

        return url;
    },

    /**
     * url编码.
     * @method urlEncode
     * @param {String} s 要编码的url.
     * @return {String} 编码后的url.
     */
    urlEncode: function(s) {
        return encodeURIComponent(s);
    },

    /**
     * url解码.
     * @method urlDecode
     * @param {String} s 要解码的url.
     * @param {Boolean} filterPlus 是否要过滤url中的‘+’号.
     * @return {String} 解码后的url.
     */
    urlDecode: function(s, filterPlus) {
        s = filterPlus === true ? s.replace(/\+/g, BLANK) : s;
        return decodeURIComponent(s);
    },

    /**
     * 将字符串escape为可用于正则表达式（转义）.
     * 所有空白和以下字符将被escaped:
     *      - $ ^ * ( ) + [ ] { } | \ , . ?
     * @method escapeRegex
     * @param {String} str 要escaped的字符串.
     * @return {String} escaped的字符串.
     */
    escapeRegex: function(str) {
        return (str + EMPTY).replace(escapeRegExpRe, '\\$&');
    },

    /**
     * 将一查询字符串转为json对象（参考Ext）.
     * @method unparam
     * @example
     * Non-recursive:
     *
     *     gr.String.unparam("foo=1&bar=2"); // returns {foo: 1, bar: 2}
     *     gr.String.unparam("foo=&bar=2"); // returns {foo: '', bar: 2}
     *     gr.String.unparam("some%20price=%24300"); // returns {'some price': '$300'}
     *     gr.String.unparam("colors=red&colors=green&colors=blue"); // returns {colors: ['red', 'green', 'blue']}
     *
     * Recursive:
     *
     *     gr.String.unparam(
     *         "username=Jacky&"+
     *         "dateOfBirth[day]=1&dateOfBirth[month]=2&dateOfBirth[year]=1911&"+
     *         "hobbies[0]=coding&hobbies[1]=eating&hobbies[2]=sleeping&"+
     *         "hobbies[3][0]=nested&hobbies[3][1]=stuff", true);
     *
     *     // returns
     *     {
     *         username: 'Jacky',
     *         dateOfBirth: {
     *             day: '1',
     *             month: '2',
     *             year: '1911'
     *         },
     *         hobbies: ['coding', 'eating', 'sleeping', ['nested', 'stuff']]
     *     }
     *
     * @param {String} str 要处理的字符串.
     * @param {Boolean} [recursive=false] 是否递归深度处理.
     * @param {String} sep 字符串分隔符，默认‘&’.
     * @param {String} eq 键值对分隔符，默认‘=’.
     * @return {Object} 返回转化的json对象.
     */
    unparam: function(str, recursive, sep, eq) {
        sep = sep || '&';
        eq = eq || '=';
        var parts = str.replace(/^\?/, EMPTY).split(sep),
            rs = {},
            i, ln,
            decode = V.String.urlDecode,
            pair,
            temp, name, value,
            part, j, subLn, matchedKeys, matchedName,
            keys, key, nextKey;

        for (i = 0, ln = parts.length; i < ln; ++i) {
            part = parts[i];
            if (part.length === 0) continue; // like str = '&a=b&&c=1'

            pair = part.split(eq); // => [key, value]
            name = decode(pair[0]);
            value = (pair[1] !== undefined) ? decode(pair[1]) : '';

            if (!recursive) {
                if (rs.hasOwnProperty(name)) {
                    if (!V.isArray(rs[name])) {
                        rs[name] = [rs[name]];
                    }

                    rs[name].push(value);
                } else {
                    rs[name] = value;
                }
            } else {
                matchedKeys = name.match(/(\[):?([^\]]*)\]/g);
                matchedName = name.match(/^([^\[]+)/);

                //<debug error>
                if (!matchedName) {
                    V.error('[V.String.unparam] unparam failed parsing name from "' + part + '"');
                }
                //</debug>

                name = matchedName[0];
                keys = [];

                if (matchedKeys === null) {
                    rs[name] = value;
                    continue;
                }

                for (j = 0, subLn = matchedKeys.length; j < subLn; ++j) {
                    key = matchedKeys[j];
                    key = (key.length === 2) ? '' : key.substring(1, key.length - 1);
                    keys.push(key);
                }

                keys.unshift(name);

                temp = rs;

                for (j = 0, subLn = keys.length; j < subLn; ++j) {
                    key = keys[j];

                    if (j === subLn - 1) {
                        if (V.isArray(temp) && key === '') {
                            temp.push(value);
                        } else {
                            temp[key] = value;
                        }
                    } else {
                        if (temp[key] === undefined || typeof temp[key] === 'string') {
                            nextKey = keys[j+1];

                            temp[key] = (V.isNumeric(nextKey) || nextKey === '') ? [] : {};
                        }

                        temp = temp[key];
                    }
                }
            }
        }

        return rs;
    }
};

/**
 * alias for gr.String.unparam.
 * @method unparam
 * @for gr
 */
V.unparam = V.String.unparam;
/**
 * @module GR
 * @submodule GR-lang
 */

var FP = Function.prototype,
    TMPCTOR = function() {};

/**
 * function util.
 * @class Function
 */
V.Function = {
    /**
     * 创建一function，将fn的this指针改为scope，并传递参数（参数位置在前）.
     * @method bind
     * @param {Function} fn 要改造的函数.
     * @param {Object} scope 覆盖fn中的this.
     * @param {...} var_args 可选的传入参数.
     * @return {Function} 返回delegate.
     */
    bind: function(fn, scope/*,var_args*/) {
        if (!V.isFunction(fn)) {
            V.error('illegal function input @gr.Function.bind');
        }

        var bound, args;

        if (FP.bind && fn.bind === FP.bind) {
            return FP.bind.apply(fn, SLICE.call(arguments, 1));
        }

        args = SLICE.call(arguments, 2); // var_args

        return bound = function() {
            if (!(this instanceof bound)) {
                return fn.apply(scope, args.concat(SLICE.call(arguments)));
            }

            TMPCTOR.prototype = fn.prototype;
            var self = new TMPCTOR();
            TMPCTOR.prototype = null;

            var result = fn.apply(self, args.concat(SLICE.call(arguments)));

            if (Object(result) === result) {
                return result;
            }

            return self;
        };
    },

    /**
     * 主要用于fn属性扩展.
     * @method setter
     * @example:
     *     var applyCfg = gr.Function.setter(function(name, value, ov) {
     *         this.cfg[name] = value;
     *     });
     *
     *     // 设置2个参数的 name - value
     *     applyCfg('name1', 'value1', false);
     *
     *     // 设置json键值对
     *     applyCfg({
     *         name1: 'value1',
     *         name2: 'value2',
     *         name3: 'value3'
     *     });
     *
     * @param {Function} fn map function.
     * @return {Function} 返回setter wrap函数.
     */
    setter: function(fn) {
        return function(a, b, ov) {
            var me = this;

            if (a === null) {
                return me;
            }

            if (typeof a !== 'string') {
                V.each(a, function(val, key) {
                   fn.call(me, key, val, false !== b);
                });
            } else {
                fn.call(me, a, b, false !== ov);
            }

            return me;
        };
    },

    /**
     * 函数延时实行，被动.
     * @method delay
     * @param {Function} fn 要延时delegate的函数.
     * @param {Number} delay 延时毫秒数.
     * @param {Object} scope 覆盖fn中的this.
     * @param {...} var_args 可选的传入参数.
     * @return {Function} 返回delay fn.
     */
    delay: function(fn, delay, scope/*,var_args*/) {
        var args = SLICE.call(arguments, 3);
        return setTimeout(function(){
            return fn.apply(scope || this, args);
        }, delay);
    },

    /**
     * 主动性质的推迟.
     * @method defer
     * @param {Function} fn 要延时的函数.
     * @return {Function} 返回defer fn.
     */
    defer: function(fn) {
        return this.delay.apply(this, [fn, 1].concat(SLICE.call(arguments, 1)));
    },

    /**
     * 函数只执行一次.
     * @method once
     * @param {Function} fn 执行函数.
     * @param {Object} scope fn context.
     * @return {Function} 返回只执行一次的function.
     */
    once: function(fn, scope) {
        var ran = false, memo;
        return function() {
            if (ran) {
                return memo;
            }
            ran = true;
            memo = fn.apply(scope || this, arguments);
            fn = null;
            return memo;
        };
    },

    /**
     * 在给定的间隔内只执行fn一次，特别对于操作频繁且耗时的算法.
     * @method throttle
     * @param {Function} fn 执行函数.
     * @param {Number} [interval] 执行间隔.
     * @param {Object} scope fn context.
     * @return {Function} 返回给定间隔内只执行一次的function.
     */
    throttle: function(fn, interval, scope) {
        var lastCallTime, elapsed, lastArgs, timer,
        execute = function() {
            fn.apply(scope || V.global, lastArgs);
            lastCallTime = new Date().getTime();
        };

        return function() {
            elapsed = new Date().getTime() - lastCallTime;
            lastArgs = arguments;

            clearTimeout(timer);
            if (!lastCallTime || (elapsed >= interval)) {
                execute();
            } else {
                timer = setTimeout(execute, interval - elapsed);
            }
        };
    }
};

/**
 * alias for bind.
 * @method bind
 * @for gr
 */
V.bind = V.Function.bind;
/**
 * @module GR
 * @submodule GR-lang
 */

var CLONE_MARKER = '_~grclone~_'/*,
    MEMOIZE_CACHE_KEY = '_memoize_cache_'*/;

/**
 * 合并所有给定的对象，并返回合并后的新对象，注意后面的对象会覆盖前面的对象.
 * @method merge
 * @for gr
 * @param {Object} Object* 多个要合并的对象.
 * @return {Object} 返回合并后的对象.
 */
V.merge = function() {
    var args = arguments,
        len = args.length,
        i = 0,
        rs = {};

    for (; i < len; ++i) {
        V.mix(rs, args[i], true);
    }

    return rs;
};

/**
 * 继承，注意静态函数不继承.
 * @method extend
 * @param {Function} r 子类.
 * @param {Function} s 父类，将要被继承.
 * @param {Object} protos 要添加到子类的原型对象属性，如果子类已经存在，将覆盖.
 * @param {Object} $statics 要添加到子类的静态属性，如果子类已经存在，将覆盖.
 * @return {Object} 返回扩展后的对象.
 */
V.extend = function(r, s, protos, $statics) {
    if (!s || !r) {
        V.error('extend failed on gr.extend');
    }

    var sp = s.prototype, rp = V.Object.create(sp);
    r.prototype = rp;

    rp.constructor = r;
    r.superClass_ = sp; // superClass_ property

    // assign constructor property
    if (s != Object && sp.constructor == OP.constructor) {
        sp.constructor = s;
    }

    if (protos) {
        V.mix(rp, protos, true);
    }

    if ($statics) {
        V.mix(r, $statics, true);
    }

    return r;
};

/**
 * 深度 Array 和 Object 的copy（提取自YUI）.
 * @method clone
 * @param {Object} o 要拷贝的对象.
 * @param {Boolean} safe 如果为true，则不克隆prototype上面的属性.
 * @param {Function} filterFn 针对每个属性进行过滤.
 * @param {Object} scope 针对filterFn的context.
 * @param {Object} cloned 已克隆对象传值入口，防止同一个对象多次拷贝.
 * @return {Array|Object} 返回克隆的对象或数组.
 */
V.clone = function(o, safe, filterFn, scope, cloned) {
    if (!V.isObject(o) || o === V) {
        return o;
    }

    var o2, marked = cloned || {}, stamp;

    switch (V.typeOf(o)) {
        case 'date':
            return new Date(o);
        case 'regexp':
            // if we do this we need to set the flags too
            // return new RegExp(o.source);
            return o;
        case 'function':
            // o2 = Y.bind(o, owner);
            // break;
            return o;
        case 'array':
            o2 = [];
            break;
        default:
            // #2528250 only one clone of a given object should be created.
            if (o[CLONE_MARKER]) {
                return marked[o[CLONE_MARKER]];
            }

            stamp = V.guid();

            o2 = safe ? {} : V.Object.create(o);

            o[CLONE_MARKER] = stamp;
            marked[stamp] = o;
    }

    // #2528250 don't try to clone element properties
    if (!o.addEventListener && !o.attachEvent) {
        V.each(o, function(v, k) {
            if ((k || k === 0) &&
             (!filterFn || (filterFn.call(scope || this, v, k, this, o) !== false))) {
                if (k !== CLONE_MARKER) {
                    if (k == 'prototype') {
                        // skip the prototype
                    // } else if (o[k] === o) {
                    //     this[k] = this;
                    } else {
                        this[k] = V.clone(v, safe, filterFn, scope, marked);
                    }
                }
            }
        }, o2);
    }

    if (!cloned) {
        V.each(marked, function(v) {
            if (v[CLONE_MARKER]) {
                try {
                    delete v[CLONE_MARKER];
                } catch (e) {
                    v[CLONE_MARKER] = null;
                }
            }
        }, this);
        marked = null;
    }

    return o2;
};

function simpleHash_(fid, args) {
    var context = [fid],
        i = args.length - 1;

    for (; i >= 0; --i) {
        context.push(typeof args[i], args[i]);
    }

    return context.join('\x0B');
}

/**
 * 记忆func的执行结果，特别针对func需要耗时耗空间的计算时.
 * @method memoize
 * @param {Function} func 要memoize的函数.
 * @param {Object} [cache] 用来缓存执行结果.
 * @param {Function} hash 对func进行hash，获得func对应的key，用于cache.
 * @param {*} refetch 如果该值存在，则用于比对，当cache的值和改值相等时就重新计算，刷新cache.
 * @return {*} func的执行结果.
 */
V.memoize = function(func, cache, hash, refetch) {
    var fid = V.stamp(func);
    hash = hash || simpleHash_;

    cache = cache || {};

    return function() {
        var key = hash.apply(this, fid, arguments);

        if (!(key in cache) || (refetch && cache[key] == refetch)) {
            cache[key] = func.apply(func, arguments);
        }

        return cache[key];
    };
};

/**
 * from underscore.js.
 * @private
 */
function equal_(a, b, aStack, bStack) {
    if (a === b) {
        return true;
    }

    if (a == null || b == null) {
        return a === b;
    }

    var type = V.typeOf(a);

    if (type != V.typeOf(b)) {
        return false;
    }

    switch (type) {
        case 'string':
            return a == b;
        case 'date':
        case 'boolean':
            return +a == +b;
        case 'number':
            return V.isNumeric(a) && V.isNumeric(b) && a == b;
        case 'regexp':
            return a.source == b.source && a.global == b.global &&
               a.multiline == b.multiline && a.ignoreCase == b.ignoreCase;
    }

    if (typeof a != 'object' || typeof b != 'object') {
        return false;
    }

    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
        // Linear search. Performance is inversely proportional to the number of
        // unique nested structures.
        if (aStack[length] == a) {
            return bStack[length] == b;
        }
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);

    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (type == 'array') {
        // Compare array lengths to determine if a deep comparison is necessary.
        size = a.length;
        result = size == b.length;
        if (result) {
            // Deep compare the contents, ignoring non-numeric properties.
            while (size--) {
              if (!(result = equal_(a[size], b[size], aStack, bStack))) break;
            }
        }
    } else {
        // Objects with different constructors are not equivalent, but `Object`s
        // from different frames are.
        var aCtor = a.constructor, bCtor = b.constructor, key;
        if (aCtor !== bCtor && !(V.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                               V.isFunction(bCtor) && (bCtor instanceof bCtor))) {
            return false;
        }
        // Deep compare objects.
        for (key in a) {
            if (HASOWN(a, key)) {
                // Count the expected number of properties.
                size++;
                // Deep compare each member.
                if (!(result = HASOWN(b, key)
                    && equal_(a[key], b[key], aStack, bStack))) break;
            }
        }
        // Ensure that both objects contain the same number of properties.
        if (result) {
            for (key in b) {
                if (HASOWN(b, key) && !(size--)) break;
            }
            result = !size;
        }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();

    return result;
}

/**
 * 深度比较2个对象是否相等.
 * @method isEqual
 * @param {Object} a 要比较的对象1.
 * @param {Object} b 要比较的对象2.
 * @param {Array} aStack 比较临时容器.
 * @param {Array} bStack 比较临时容器.
 * @return {Boolean} 若相等则返回true.
 */
V.isEqual = function(a, b, aStack, bStack) {
    return equal_(a, b, aStack || [], bStack || []);
};

/**
 * 在当前环境下执行脚本.
 * @method globalEval
 * @param {String} jsTxt 待执行的js字符串.
 */
V.globalEval = function(jsTxt) {
    if (jsTxt && /\S/.test(jsTxt)) {
        (HOST.execScript || function(jsTxt) {
            HOST["eval"].call(HOST, jsTxt);
        })(jsTxt);
    }
};

/**
 * 空函数.
 * @method noop
 */
V.noop = function() {};

/**
 * @module GR
 * @submodule GR-Date
 */

/**
 * Date.
 * @class Date
 */
V.Date = {
    /**
     * 格式化日期.
     * @method format
     * @param {Date} date the Date to format.
     * @param {String} fmt format pattern.
     * @return {String} the formated date.
     */
    format: function(date, fmt){
        if (!date || !fmt) {
            return date;
        }

        date = V.isString(date) ? new Date(date.replace(/-/g, "/")) : date;

        var o = {
            "M+" : date.getMonth() + 1, //月份
            "d+" : date.getDate(), //日
            "h+" : date.getHours(), //小时
            "m+" : date.getMinutes(), //分
            "s+" : date.getSeconds(), //秒
            "q+" : Math.floor((date.getMonth() + 3) / 3), //季度
            "S" : date.getMilliseconds() //毫秒
        }, k;

        if (/(y+)/.test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
        }

        for (k in o){
            if (new RegExp("(" + k + ")").test(fmt)) {
                fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
            }
        }

        return fmt;
    }
};
/**
 * @module SJ
 * @submodule SJ-Util
 */

/**
 * Queue base.
 * @class Queue
 */
function Queue() {
    var me = this;

    /**
     * 队列集合.
     * @property items
     * @type {Array}
     */
    me.items = [];

    // init
    me.add.apply(me, arguments);
}

Queue.prototype = {
    /**
     * 入队.
     * @method add
     * @param {*} 要添加的项.
     * @return {Object} 返回当前队列.
     */
    add: function() {
        AP.push.apply(this.items, arguments);
        return this;
    },

    /**
     * 清空队列.
     * @method clear
     * @return {Object} 返回当前队列.
     */
    clear: function() {
        this.items.length = 0;
        return this;
    },

    /**
     * 移除队列的第一个元素，并返回（FIFO）。
     * @method first
     * @return {*} 返回队列第一个项.
     */
    first: function() {
        return this.items.shift();
    },

    /**
     * 移除队列的最后一个元素，并返回（LIFO）。
     * @method last
     * @return {*} 返回队列最后一个项.
     */
    last: function() {
        return this.items.pop();
    },

    /**
     * 返回队列长度.
     * @method size
     * @return {Number} 返回队列长度.
     */
    size: function() {
        return this.items.length;
    }
};

V.Queue = Queue;

/**
 * 对signal或者aop的返回值进行封装，统一接口.
 * @class SigHandle
 * @constructor
 * @param {Signal} sig the signal.
 * @param {Slot} slot the slot.
 * @param {Boolean} aop 是否aop返回对象.
 */
V.SigHandle = function(sig, slot, aop) {
    var me = this;

    /**
     * the signal
     * @property sig
     * @type Signal
     */
    me.sig = sig;

    /**
     * the slot
     * @property slot
     * @type Slot
     */
    me.slot = slot;

    /**
     * 是否aop对象.
     * @property isAop
     * @type Boolean
     */
    me.isAop = aop;
};

V.SigHandle.prototype = {
    /**
     * 移除slot或者unadvise.
     * @method off
     * @return {Number} 返回操作对象的个数.
     */
    off: function() {
        var me = this, deleted = 0, m;

        if (me.isAop) {
            m = V.Object.getKeys(me.slot); // 获取methodNames
            V.aop.unadvise(me.sig, m); // unadvise
        } else {
            if (V.isArray(me.sig)) {
                V.each(me.sig, function(sig) {
                    deleted += sig.off();
                });
            } else {
                me.sig._delSlot(me.slot);
                deleted = 1;
            }
        }

        return deleted;
    }
};

/**
 * JavaScript AOP.
 * @module event-custom
 * @submodule event-custom-base
 */

var ADVICETYPE = {
    'before': true,
    'around': true,
    'afterReturn': true,
    'afterThrow': true,
    'after': true // like finally
}, AOP;

/**
 * aop.
 * @class aop
 * @static
 */
AOP = V.aop = {
    /**
     * 横切.
     * @method advise
     * @param {Object} obj 被切入对象所在环境上下文(不能为dom对象).
     * @param {String|Array|Regexp} [method] advised对象，可以是多个，支持正则匹配.
     * @param {Object|Function|Array} advice advice列表.
     * @return {Object|Array}
     */
    advise: function(obj, method, advice) {
        // 优先判断原型链上的
        obj = obj.prototype || obj;

        if (!V.isArray(method)) {
            method = [method];
        }

        var methods = _getMethods(obj, method);

        if (!V.isArray(advice)) {
            advice = [advice];
        }
        // 没有advice或者advised时，直接返回null.
        if (methods.length === 0 || advice.length === 0) {
            return null;
        }

        var id = V.stamp(obj), sid, o = obj._graop, adv, s, m = {};

        if (!o) {
            o = obj._graop = {};
        }

        V.each(methods, function(name) {
            adv = o[name];
            if (!adv) {
                adv = o[name] = new Advised(obj, name);
                // 重新封装被横切方法.
                obj[name] = function() {
                    return adv.exec.apply(adv, arguments);
                };
            }
            // 注册advices
            V.each(advice, function(advise) {
                for (var when in advise) {
                    if (ADVICETYPE[when]) { // 只有before、around、afterReturn、afterThrow、after
                        s = advise[when];
                        // slot id ==> objId + methodName + slotId
                        sid = id + name + V.stamp(s);
                        adv.add(sid, s, when);
                    }
                }
            });
            // 传递advised对象.
            m[name] = adv;
        });

        return new V.SigHandle(obj, m, true);
    },

    /**
     * 取消横切.
     * @method unadvise
     * @param {Object} obj 被切入对象所在环境上下文(不能为dom对象).
     * @param {String|Array|Regexp} [method] advised对象，可以是多个，支持正则匹配.
     * @return {Object} obj.
     */
    unadvise: function(obj, method) {
        obj = obj.prototype || obj;
        var advised = obj._graop, methods = null;

        if (advised) {
            if (method) {
                if (!V.isArray(method)) {
                    method = [method];
                }

                if (method.length) {
                    methods = _getMethods(obj, method);
                }
            }

            V.each(advised, function(adv, methodName) {
                if (methods && !V.Array.contains(methods, methodName)) {
                    return true;
                }
                obj[methodName] = adv.origin;
                adv.destroy();
                advised[methodName] = undefined;
            });
        }

        return obj;
    }
};

/**
 * @private
 */
function _getMethods(obj, method) {
    var methods = [];

    V.each(method, function(m) {
        if (V.typeOf(m) == 'regexp') { // 正则支持
            V.each(obj, function(n, p) {
                if (V.isString(p) && V.isFunction(n) && m.test(p)) {
                    methods.push(p);
                }
            });
        } else if (V.isFunction(obj[m])) {
            methods.push(m);
        }
    });

    return methods;
}

/**
 * 返回一个对象，告诉执行函数的传入参数已改变，并更新传入参数，主要适用于“before”.
 * @class aop.AlterArgs
 * @constructor
 * @param {Array} newArgs 新参数列表.
 * @param {String} msg 可能要传递的信息.
 */
AOP.AlterArgs = function(newArgs, msg) {
    this.newArgs = newArgs;
    this.msg = msg;
};

/**
 * 返回一个对象，告诉执行函数的返回值已改变，并更新返回值，主要适用于“after”.
 * @class aop.AlterReturn
 * @constructor
 * @param {String} msg 可能要传递的信息.
 * @param {*} newRetVal 最终返回值.
 */
AOP.AlterReturn = function(newRetVal, msg) {
    this.newRetVal = newRetVal;
    this.msg = msg;
};

/**
 * 返回一个Halt对象，停止所有advice执行，对“before”特别有用.
 * @class aop.halt
 * @constructor
 * @param {String} msg 可能要传递的信息.
 * @param {*} retVal 返回给主调函数返回.
 */
AOP.Halt = function(retVal, msg) {
    this.retVal = retVal;
    this.msg = msg;
};

/**
 * 返回一个Prevent对象，阻止origin函数执行.
 * @class aop.Prevent
 * @constructor
 * @param {String} msg  可能要传递的信息.
 */
AOP.Prevent = function(msg) {
    this.msg = msg;
};

function Advised(obj, methodName) {
    var me = this;
    me.obj = obj;
    me.methodName = methodName;
    me.origin = obj[methodName];
    me.aspects = {};
}

Advised.prototype = {
    constructor: Advised,

    /**
     * 注册aop的slot.
     * @method add
     * @param {String} sid slot标识.
     * @param {Function} fn aop slot.
     * @param {String} when 5种，before、around、afterReturn、afterThrow、after.
     */
    add: function(sid, fn, when) {
        var aspects = this.aspects,
            asp = aspects[when];

        if (!asp) {
            asp = aspects[when] = {};
        }
        asp[sid] = fn;
    },

    /**
     * 移除aop的slot.
     * @method remove
     * @param {String} sid slot标识.
     * @param {String} when 5种，before、around、afterReturn、afterThrow、after.
     */
    remove: function(sid, when) {
        var aspects = this.aspects,
            asp = aspects[when];

        if (asp && asp[sid]) {
            delete asp[sid];
        }
    },

    /**
     * destroy.
     * @method destroy
     */
    destroy: function() {
        var me = this;
        V.Object.clear(me.aspects);
        delete me.origin;
    },

    /**
     * 执行wrap后的function.
     * @method exec
     */
    exec: function() {
        var me = this,
            aspects = me.aspects,
            afterRoT,
            ret, newRet, nctor,
            prevented = false,
            args = SLICE.call(arguments),
            exception = null;

        // 执行before.
        V.each(aspects['before'], function(fn) {
            ret = fn.apply(me.obj, args);
            if (ret && ret.constructor) { // 判断返回值对象
                switch (ret.constructor) {
                    case AOP.Halt:
                        return ret.retVal;
                    case AOP.AlterArgs:
                        args = ret.newArgs;
                        break;
                    case AOP.Prevent:
                        prevented = true;
                        break;
                    default:
                }
            }
        });

        afterRoT = 'afterReturn';

        try {
            ret = me._callAroundAdvice(me, aspects['around'], args, prevented);
        } catch (ex) {
            ret = exception = ex;
            afterRoT = 'afterReturn';
        }

        args = [ret];

        // 执行afterReturn或者afterThrow
        V.each(aspects[afterRoT], function(fn) {
            ret = fn.apply(me.obj, args);
        });

        // 执行after.
        V.each(aspects['after'], function(fn) {
            newRet = fn.apply(me.obj, args);
            if (newRet && (nctor=newRet.constructor)) {
                // 如果返回AOP.Halt，则停止执行advice.
                if (nctor == AOP.Halt) {
                    return newRet.retVal;
                // 判断是否新的返回值.
                } else if (nctor == AOP.AlterReturn) {
                    ret = newRet.newRetVal;
                }
            }
        });

        if (exception !== null) {
            throw exception;
        }

        return ret;
    },

    /**
     * around.
     * @method _callAroundAdvice
     * @private
     */
    _callAroundAdvice: function(me, arounds, args, prevented) {
        var arr = arounds ? V.Object.getValues(arounds) : [],
            len = arr.length;

        function callNext(i, args) {
            var ret;
            if (i < 0) {
                if (!prevented) {
                    ret = me.origin.apply(me.obj, args);
                }
            } else {
                ret = callAround(arr[i], i, args);
            }
            return ret;
        }

        function callAround(around, i, arg) {
            var proceedCallCount = 0, // origin调用次数.
                joinpoint = {
                    obj: me.obj,
                    methodName: me.methodName,
                    args: arg,
                    proceed: proceedCall,
                    proceedCount: proceedCount
                };

            return around.call(me.obj, joinpoint);

            function proceedCall(/* newArg1, newArg2... */) {
                return proceed(arguments.length > 0 ? SLICE.call(arguments) : args);
            }

            function proceedCount() {
                return proceedCallCount;
            }

            function proceed(args) {
                proceedCallCount++;
                return callNext(i-1, args);
            }
        }

        return callNext(len-1, args);
    }
};

/**
 * 自定义事件slot部分.
 * @param {Function} listener 监听函数.
 * @param {Object} scope listener执行的‘this’.
 * @param {Object} cfg 其他信息，如优先级(priority)、是否只执行一次(once)、捕获(capture)、前置参数(args).
 * @class Slot
 * @constructor
 */
V.Slot = function(listener, scope, cfg) {
    var me = this;

    /**
     * 监听函数.
     * @property fn
     * @type {Function}
     */
    me.fn = listener;

    /**
     * listener执行的‘this’.
     * @property scope
     * @type {Object}
     */
    me.scope = scope;

    /**
     * slot配置信息.
     * <br/>- preArgs {*} 该listener的预置参数，在触发时传入.
     * <br/>- once {Boolean} 是否只执行一次.
     * <br/>- priority {Number} 优先级.
     * <br/>- capture {Boolean} 是否可捕获，针对dom事件.
     * @property cfg
     * @type {Object}
     */
    me.cfg = V.isObject(cfg) ? cfg : {};
};

V.Slot.prototype = {
    constructor: V.Slot,

    /**
     * 修改配置信息.
     * @method applyCfg
     * @param {Object|String} key 配置信息或者键.
     * @param {*} val 键值.
     * @param {Boolean} ov 是否覆盖已有属性.
     * @return {Slot} 返回该slot.
     */
    applyCfg: V.Function.setter(function(name, value, ov) {
        if (ov || !this.cfg[name]) {
            this.cfg[name] = value;
        }
    }),

    /**
     * 比较给定的函数和scope是否和当前的一样.
     * @method isEquals
     * @param {Function} fn 要比较的函数.
     * @param {Object} scope slot的listenter执行的this.
     * @return {Boolean} 如果一样则返回true.
     */
    isEqual: function(fn, scope) {
        return this.fn == fn && (scope ? this.scope == scope : true);
    },

    /**
     * 通知listener执行.
     * @method notify
     * @param {*} args 传给listener的参数.
     * @param {Signal} signal 触发信号.
     * @return {*} 返回listener的执行结果.
     */
    notify: function(args, signal) {
        var me = this,
            scope = me.scope,
            ret;

        if (!me.deleted) {
            if (me.fn) {
                try {
                    if (!V.isArray(args)) {
                        args = V.Array.makeArray(args);
                    }
                    // callback scope
                    scope = scope || (V.isFunction(signal.scopeFn) ? signal.scopeFn() : signal.scope);
                    // 注意传入的参数的最后一个为当前slot的cfg.
                    ret = me.fn.apply(scope, args.concat(me.cfg));
                } catch (e) {
                    V.error(me + ' failed: ' + e.message);
                }
            }
            // 执行一次的执行后删除.
            if (me.cfg.once) {
                me.deleted = true; // 已删除标志
                signal._delSlot(me);
            }
        }

        return ret;
    }
};

/**
 * Signal.
 * @module event-custom
 * @submodule event-custom-base
 */

/**
 * 自定义事件信号部分.
 * @param {String} type 信号类型.
 * @param {Object} cfg 信号配置选项.
 * @class Signal
 * @constructor
 */
V.Signal = function(type, cfg) {
    var me = this;

    /**
     * 信号类型.
     * @property type
     * @type String
     */
    me.type = type;

    /**
     * 用于注册slots.
     * @property _slots
     * @type Array
     * @private
     */
    me._slots = [];

    /**
     * signal配置信息.
     * <br/>- scope {Object} 在slot处有用.
     * <br/>- once {Boolean} 信号是否只发射一次，并且如果该信号已经发射过，那么所有新加入的slot都必须立即被通知.
     * <br/>- preArgs {Array} 只对once有效，当once为true且信号fired为true时，
                            对后续添加的slot的执行直接传入该参数.
     * <br/>- async {Boolean} 对于once的类型，在后续执行时是放放入队列.
     * <br/>- broadcast {Boolean} 信号发射时，是否进行广播.
     * <br/>- bch {Array} 信号发射时，广播信道，当broadcast为true时有效，默认为GR对象.
     * <br/>- evtObject {Boolean} 针对dom事件的设置.
     * @property cfg
     * @type {Object}
     */
    me.cfg = V.isObject(cfg) ? cfg : {};

    /**
     * 该signal的宿主，主要用于bubble.
     * @property host
     * @type Object
     */
    me.host = me.cfg.host || V;

    /**
     * 该信号是否已经发射过.
     * @property fired
     * @type Boolean
     */
    // me.fired = false;
};

V.Signal.prototype = {
    constructor: V.Signal,

    /**
     * 获取注册的总数.
     * @method getCount
     */
    getCount: function() {
        return this._slots.length;
    },

    /**
     * 返回slot列表.
     * @method getSlots
     * @return {Array} slot列表.
     */
    getSlots: function() {
        return this._slots;
    },

    /**
     * 修改配置信息.
     * @method applyCfg
     * @param {Object|String} key 配置信息或者键.
     * @param {*} val 键值.
     * @param {Boolean} ov 是否覆盖已有属性.
     * @return {Signal} 返回signal对象.
     */
    applyCfg: V.Function.setter(function(name, value, ov) {
        if (ov || !this.cfg[name]) {
            this.cfg[name] = value;
        }
    }),

    /**
     * 注册listener.
     * @method on
     * @param {Function|Signal} listener 监听函数或者信号级联.
     * @param {Object} scope listener执行的‘this’.
     * @param {Object} opts 额外配置，如优先级、是否只执行一次等.
     * @return {SigHandle}
     */
    on: function(listener, scope, opts) {
        var me = this,
            slot,
            priority,
            _p,
            o = me._slots,
            s,
            cfg = me.cfg,
            len = o.length;

        slot = (listener instanceof V.Slot) ? listener : new V.Slot(listener, scope, opts); // slot实例

        if (cfg.once && me.fired) {
            if (cfg.async) {
                setTimeout(V.bind(me._emit, me, slot, cfg.preArgs), 0);
            } else {
                me._emit(slot, cfg.preArgs);
            }
        }

        priority = slot.cfg.priority; // 是否优先级设置
        // 优先级插入位置
        if (V.isNumeric(priority) && priority > 0) {
            for (; s = o[--len]; ) {
                _p = s.cfg.priority || 0;

                if (priority <= _p) {
                    break;
                }
            }
        }
        // insert
        o.splice(len < 0 ? 0 : len, 0, slot);

        return new V.SigHandle(me, slot);
    },

    /**
     * 信号发出后通知slot执行.
     * @method _emit
     * @param {Slot} slot 要通知的slot.
     * @param {Array} args 传给slot的listener执行的参数.
     * @private
     */
    _emit: function(slot, args) {
        if (false === slot.notify(args, this) || this.stopped > 1) {
            return false;
        }

        return true;
    },

    /**
     * 移除listeners.
     * @method off
     * @param {Function} listener 监听函数，如果没传入，则移除scope下所有.
     * @param {Object} scope listener执行的‘this’.
     * @return {Number} 返回移除的数量.
     */
    off: function(listener, scope) {
        if (listener && listener.off) {
            return listener.off();
        }

        var s,
            slots = this._slots,
            deleted = 0,
            len = slots.length;

        for (; s = slots[--len]; ) {
            // 如果listener为空，则移除所有
            if (s && (!listener && (scope ? scope == s.scope : 1)
                || s === listener || s.isEqual(listener, scope))) {
                this._delSlot(s, slots, len);
                deleted++;
            }
        }

        return deleted;
    },

    /**
     * 移除slot.
     * @method _delSlot
     * @param {Slot} slot 要移除的slot.
     * @return {Boolean} 返回移除成功或者失败.
     * @private
     */
    _delSlot: function(slot, slots, idx) {
        if (!slots) {
            slots = this._slots;
            idx = V.Array.indexOf(slots, slot);
        }

        if (slot && slots[idx] === slot) {
            slots.splice(idx, 1);
        }
    },

    /**
     * 信号发出，通知所有的slot执行.
     * @method fire
     * @return {Boolean} 如果有一个slot返回false则false，否则为true.
     */
    fire: function() {
        var me = this,
            cfg = me.cfg;

        // 针对 once 的signal并且fired
        if (cfg.once && me.fired) {
            return true;
        }

        var args = SLICE.call(arguments, 0),
            slots = me._slots,
            i,
            s;

        // 已发射标识
        me.fired = true;

        if (cfg.once) {
            cfg.preArgs = args;
        }

        // 如果是dom event
        if (cfg.evtObject) {
            return me.fireWrap(args);
        }

        me.stopped = 0;
        me.prevented = 0;

        if (me.getCount()) {
            for (i = 0; s = slots[i]; ++i) {
                if (s && false === me._emit(s, args)) {
                    me.stopped = 2; // 自定义signal，无bubbles
                    break;
                }
            }
        }

        // 广播通知
        me._broadCast(args);

        return me.stopped ? false : true;
    },

    /**
     * 主要针对dom事件的EventObject.
     * 需要dom事件封装模块.
     */
    fireWrap: function() {
        return true;
    },

    /**
     * 信号发出后，可能产生广播行为.
     * @method _broadCast
     * @param {Array} args slot执行参数.
     */
    _broadCast: function(args) {
        var me = this, cfg = me.cfg;

        if (!me.stopped && cfg.broadcast) {
            var cloneArgs = args.concat(),
                bch = cfg.bch || [V];

            cloneArgs.unshift(me); // 头参数为 信号对象

            V.each(bch, function(o) {
                if (o && me.host !== o) {
                    V.isFunction(o.fire) && o.fire.apply(o, cloneArgs);
                }
            });
        }
    }
};
/**
 * SignalSlot Connection.
 * @module event-custom
 * @submodule event-custom-base
 */
var DELIMITER = ':',
    BLANK_RE = /\s+/,
/**
 * parse信号类型（如“click”、“click:Button”、“change:value”）.
 * @method _parseType
 * @private
 */
_parseType = V.memoize(function(type, ns) {
    if (!ns || !V.isString(type) || V.String.contains(type, DELIMITER)) {
        return type;
    }

    return type + DELIMITER + ns;
});

/**
 * 连接signal和slot.
 * @param {Object} cfg 配置选项.
 * @class SigSlot
 * @constructor
 */
function SigSlot(cfg) {
    var me = this,
        opt = V.isObject(cfg) ? cfg : {};

    /**
     * 信号类型.
     * @property _sscache
     * @type {Object}
     * @private
     */
    me._sscache = {
        sigs: {},
        cfg: opt,
        def: {
            scope: opt.scope || me,
            host: me,
            preArgs: opt.preArgs,
            async: opt.async,
            evtObject: opt.evtObject,
            once: opt.once,
            broadcast: opt.broadcast,
            bch: opt.bch,
            bubbles: opt.bubbles
        }
    };
}

SigSlot.prototype = {
    constructor: SigSlot,

    /**
     * 注册signal和slot.
     * <br/> type的情况：
     * <br/> -- "click" "change:name" // 传统
     * <br/> -- "menu:click dblclick mouseover" // 空格分隔
     * <br/> -- {click: function() {}, mouseover: function() {}} // 对象,此情况为单参数
     * @method on
     * @param {Object|String} types 信号类型或者信号集合.
     * @param {Object|String} other 可选的跟踪对象（delegate）.
     * @param {Function} listener 监听函数.
     * @param {Object} scope listener执行的‘this’.
     * @param {Object} cfg 额外配置，如优先级、是否只执行一次等.
     * @return {SigSlot}
     */
    on: function(type, other, listener, scope, cfg) {
        var me = this, sig, i, len, sigs, _t;

        if (V.isObject(type)) {
            cfg = scope;
            scope = listener;
            for (_t in type) {
                me.on(_t, other, type[_t], scope, cfg);
            }

            return me;
        }

        type = V.String.trim(type);

        if (BLANK_RE.test(type)) { // 空格分隔
            type = type.split(BLANK_RE);
        }

        !V.isArray(type) && (type = [type]);

        sigs = me._sscache.sigs;

        if (V.isFunction(other)) {
            // on(type, listener, scope, cfg)
            cfg = scope;
            scope = listener;
            listener = other;
            other = undefined;
        }

        for (i = 0, len = type.length; i < len; ++i) {
            _t = type[i];
            sig = sigs[_t] || me.makeSig(_t);
            sig.on(listener, scope, cfg);
        }

        return me;
    },

    /**
     * 创建signal对象.
     * @method makeSig
     * @param {String} type 信号类型.
     * @param {Object} sigcfg 信号配置.
     * @return {Signal} 返回Signal对象.
     */
    makeSig: function(type, sigcfg) {
        var me = this, ssc = me._sscache, sig;

        type = ssc.cfg.ns ? _parseType(type, ssc.cfg.ns) : type;
        sig = ssc.sigs[type];

        if (!sig) { // 创建signal对象.
            sig = new V.Signal(type, ssc.def);
            ssc.sigs[type] = sig;
        }

        if (sigcfg) {
            sig.applyCfg(sigcfg);
        }

        return sig;
    },

    /**
     * 注册signal和slot，只执行一次.
     * @method on
     * @param {Object|String} type 信号类型或者信号集合.
     * @param {Function|Signal} listener 监听函数或者信号级联.
     * @param {Object} scope listener执行的‘this’.
     * @param {Object} cfg 额外配置，如优先级、是否只执行一次等.
     * @return {SigHandle}
     */
    once: function(type, listener, scope, cfg) {
        cfg = V.isPlainObject(cfg) ? cfg : {};
        cfg.once = true;

        return this.on(type, listener, scope, cfg);
    },

    /**
     * 移除slot.
     * @method off
     * @param {Function} listener 监听函数，如果没传入，则移除scope下所有.
     * @param {Object} scope listener执行的‘this’.
     * @return {Number} 返回移除的数量.
     */
    off: function(type, listener, scope) {
        V.log(type);
        V.log(listener);
        V.log(scope);
    },

    /**
     * 触发信号.
     * @method fire
     * @param {Sting} type 信号类型.
     * @return {*} slot返回结果.
     */
    fire: function(type) {
        var me = this,
            args = SLICE.call(arguments, 1),
            sig, ret, ssc = me._sscache;

        type = ssc.cfg.ns ? _parseType(type, ssc.cfg.ns) : type;
        sig = ssc.sigs[type];

        if (sig) {
            ret = sig.fire.apply(sig, args);
        }

        return ret;
    }
};

// 使gr拥有connect signal 和slot能力
V.mix(V, SigSlot.prototype);
SigSlot.call(V, {bubbles: false});

// gr.SigSlot class
V.SigSlot = SigSlot;
})(this);