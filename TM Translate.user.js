// ==UserScript==
// @name         TM Translate
// @author       QuocBao
// @namespace    http://tampermonkey.net/
// @version      3.3.9_beta
// @description  Dịch trang, quản lý name-sets, sửa tên, chế độ đọc rút gọn và tùy chỉnh giao diện.
// @icon         data:image/png;base64,AAABAAEAQEAAAAEAIAAoQgAAFgAAACgAAABAAAAAgAAAAAEAIAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAA+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/0CLNf9BjDb/QYw2/0GMNv9BjDb/QYw2/0GMNv9BjDb/QYw2/0GMNv9BjDb/QYw2/0GMNv9BjDb/QIs1/z+LNP8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z+KNP81hCn/L4Ek/zCCJf8wgiX/MIIl/zCCJf8wgiX/MIIl/zCCJf8wgiX/MIIk/zCCJP8xgiX/MoMm/zWFKv86hy7/Pooz/0GMNv9BjDb/P4s0/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/0CLNf83hiz/gbJ6/7HQrf+py6T/qsum/6rLpv+qy6b/qsum/6rLpv+qy6b/qsum/6jKo/+fxZr/kLuJ/36xd/9oo1//UJVH/zyJMf8xgiX/MoIm/zqIL/9BjDb/QIs1/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/9AizX/M4Mo/8DZvP///////P38//////////////////////////////////////////////////////////////////X59f/b6dr/tNGw/4CyeP9Ok0T/M4Mn/zSEKP8/izT/QYw2/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/QIs1/zOEKP+71rj///////n8+f/8/fz//P38//z9/P/8/fz//P38//z9/P/8/fz//P38//z9/P/8/fz//f79//7//v//////////////////////8/jz/7zWuf9wqGj/OIYt/zOEKP9AizX/P4s0/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/0CLNv8zgyj/vde6///////8/fz//////////////////v79//3+/f/9/v3//f79//7+/v/+/v7//v/+/////////////v/+//3+/f/8/fz//f79/////////////////9Pk0f9yqWr/M4Mo/zmHLv9BjDb/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/9Aizb/M4Mo/73Xuv///////P38///////////////////////////////////////////////////////9/v3//P38//z9/P/9/v3////////////+//7//P38//3+/f///////////8DYvP9Nk0P/MoMn/0GMNv8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/QIs2/zODKP+917r///////z9/P/////////////////h7N//1+fV/9vp2f/e69z/5/Dl//P48v/9/v3///////////////////////7//v/8/fz//v7+/////////////f79//3+/P//////7/Xu/3Wrbv8wgiT/QIs1/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/0CLNv8zgyj/vde6///////8/fz/////////////////Yp9Z/zODJ/89iTP/PYoy/0ONOP9Mk0L/WptR/3Gpaf+Qu4n/ttKy/+Ds3v/9/v3////////////9/vz//v7+/////////////P38//7+/v//////lL6O/zGCJv9AizX/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/9Aizb/M4Mo/73Xuv///////P38/////////////////2ShXP82hSv/QIs1/z6KM/88iTH/Oogv/zeGLP80hCj/MYIl/zKDJv8+ijP/Yp9Z/6THn//s8+v///////7+/f/9/v3////////////+/v3//P38//////+awpX/MYIl/0GMNv8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/QIs2/zODKP+917r///////z9/P////////////////9koVz/NoUr/0CLNf8+ijP/P4o0/z+LNP8/izX/QIs1/0GMNv9BjDb/Pooz/zaFK/8wgST/Ro88/5nBk//1+fT///////z9/P////////////7//v/8/fz//////4a2gP8xgiX/QYw2/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/0CLNv8zgyj/vde6///////8/fz/////////////////ZKFb/zaFKv9AizX/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/9AizX/QYw3/zyJMf8vgSP/VZhL/9Hjzv///////P38/////////////v7+///////6/Pr/YJ9Y/zaFKv9AizX/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/9Aizb/M4Mo/73Xuv///////P38/////////////////2ShW/82hSr/QIs1/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8/ijT/Qow3/zeGLP85hy7/udW2///////8/fz////////////9/v3//////9Pk0P87iDD/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/QIs2/zODKP+917r///////z9/P////////////////9koVv/NoUq/0CLNf8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/9BjDb/PYky/zWEKf+/2Lv///////39/P////////////z9/P//////hrV//zGCJf9BjDb/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/0CLNv8zgyj/vde6///////8/fz/////////////////ZKFb/zaFKv9AizX/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/0CLNf87iTD/QIs1/93q2////////f79///////+/v3//////93q2/8/ijT/PYoy/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/9Aizb/M4Mo/73Xuv///////P38/////////////////2ShW/82hSr/QIs1/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/QYw2/zOEKP9ppGH///////7//v////////////3+/f//////dqxv/zODJ/9AjDb/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/QIs2/zODKP+917r///////z9/P////////////////9koVv/NoUq/0CLNf8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/9BjDb/MYIm/7jUtP///////f38///////8/fz//////7nUtf8ygyf/QYw2/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/0CLNv8zgyj/vde6///////8/fz/////////////////ZKFb/zaFKv9AizX/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/QIs1/zaFKv9koVz//////////////////v7+///////p8uj/RY47/zyJMf8/ijT/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/9Aizb/M4Mo/73Xuv///////P38/////////////////2ShW/82hSr/QIs1/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8/ijT/O4gw/9ro1////////f79///////+//7//////2aiXv81hSr/QIs1/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/QIs2/zODKP+917r///////z9/P////////////////9koVv/NoUq/0CLNf8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/QYw2/zCCJP+oyqP///////z9/P///////P38//////+JuIP/MYIl/0GMNv8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/0CLNv8zgyj/vde6///////8/fz/////////////////ZKFb/zaFKv9AizX/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/0GMNv8ygyb/gbJ6///////9/vz///////z9/P//////qMqj/zGCJf9BjDb/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/9Aizb/M4Mo/73Xuv///////P38/////////////////2ShW/82hSr/QIs1/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/9AizX/NYUq/2ejX////////v/+///////8/fz//////7zWuf8zgyf/QIw2/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/QIs2/zODKP+917r///////z9/P////////////////9koVv/NoUq/0CLNf8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/P4s1/ziGLP9am1D/+/37///////+//7//f79///////K38f/NoUq/0CLNf8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/0CLNv8zgyj/vde6///////8/fz/////////////////ZKFb/zaFKv9AizX/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z+LNP85hy7/U5dJ//j7+P///////v/+//3+/f//////0+TR/zmHLf8/izT/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/9Aizb/M4Mo/73Xuv///////P38/////////////////2ShW/82hSr/QIs1/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8/izT/OYcu/1OWSf/3+vf///////7//v/9/v3//////9bm1P86hy7/P4o0/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/QIs2/zODKP+917r///////z9/P////////////////9koVv/NoUq/0CLNf8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/P4s0/ziGLf9XmU7/+vz6///////+//7//f79///////R487/OIYs/z+LNP8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/0CLNv8zgyj/vde6///////8/fz/////////////////ZKFb/zaFKv9AizX/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/0CLNf82hSv/YqBa//////////////////3+/f//////xtzD/zWEKf9AizX/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/9Aizb/M4Mo/73Xuv///////P38/////////////////2ShW/82hSr/QIs1/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/9BjDb/M4Mn/3itcf///////f79///////8/fz//////7bSsv8ygyb/QYw2/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/QIs2/zODKP+917r///////z9/P////////////////9koVv/NoUq/0CLNf8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/QYw2/zCCJP+bwpX///////z9/P///////P38//////+dw5f/MIIk/0GMNv8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/0CLNv8zgyj/vde6///////8/fz/////////////////ZKFb/zaFKv9AizX/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/0CLNf81hSr/yd7F///////9/v3///////3+/f//////fK90/zKDJ/9BjDb/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/9Aizb/M4Mo/73Xuv///////P38/////////////////2ShW/82hSr/QIs1/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z+LNP85hy7/UZZI//b69v///////v/+//7//v//////+vz6/1eZTf84hi3/P4s0/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/QIs2/zODKP+917r///////z9/P////////////////9koVv/NoUq/0CLNf8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/9CjDf/MIIk/5W/j////////P38///////9/v3//////9Xl0/86hy//P4o0/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/0CLNv8zgyj/vde6///////8/fz/////////////////ZKFb/zaFKv9AizX/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8/izT/O4gw/0ePPP/r8ur///////7+/v///////P38//////+XwJH/MIIl/0GMNv8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/9Aizb/M4Mo/73Xuv///////P38/////////////////2ShW/82hSr/QIs1/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Qow3/y+BI/+tzaj///////39/P///////v/+///////2+fX/VZdL/zmHLf8/izT/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/QIs2/zODKP+917r///////z9/P////////////////9koVv/NoUq/0CLNf8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8/ijT/Qo04/y2AIf+Cs3v///////3+/f////////////z9/P//////sM+r/zKCJv9BjDb/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/0CLNv8zgyj/vde6///////8/fz/////////////////ZKFb/zaFKv9AizX/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/9BjDb/Pooz/y2AIf99sHb//P38///////+//7///////7+/v//////8/fy/1KWSf85hy7/P4s0/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/9Aizb/M4Mo/73Xuv///////P38/////////////////2ShW/82hSr/QIs1/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/P4o0/0GMNv9AizX/M4Mn/zuIMP+gxZr//v/+//7+/v/+//7////////////8/fv//////4y5hf8xgiX/QYw2/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/QIs2/zODKP+917r///////z9/P////////////////9koVv/NoUq/0CLNf8+ijP/Pooz/z6KM/8+ijP/P4o0/0CLNf9BjDb/QYw2/zyJMf8ygyb/N4Yr/3Oqa//b6dn///////3+/P/+//7////////////7/fv//////7nUtf80hCn/QIs1/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/0CLNv8zgyj/vde6///////8/fz/////////////////Z6Je/zmHLv9DjTj/QYw2/0GMNv9AizX/Pooz/zuIMP82hSv/MYIl/zKDJ/9Gjzz/frF3/9Hjzv////////////3+/f/+//7////////////7/fv//////8zgyf89iTL/PIkx/z+LNP8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/9Aizb/M4Mo/73Xuv///////P38/////////////////1maUP8nfBv/MoMn/zGCJf8ygyb/NYQp/zuIMP9JkT//YZ9Z/4e2gf+51LX/7PPr/////////////f79//3+/f////////////7+/f/8/fz//////8fdxP8/ijT/O4gv/0CLNf8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/QIs2/zODKP+917r///////z9/P////////////////+71bf/psmh/6vMpv+uzqn/t9Oz/8jdxf/a6dj/8PXv//7//v/////////////////9/v3//f79/////////////v/+//z9/P/+//7//////6rLpf84hi3/O4gw/0CLNf8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/0CLNv8zgyj/vde6///////8/fz///////////////////////////////////////////////////////////////7//P38//z9/P/+/v7////////////+/v7//P38//7+/v//////6/Pq/3mucv8xgiX/Pooz/0CLNf8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/9Aizb/M4Mo/73Xuv///////P38//////////////////3+/P/8/fz//P38//z9/P/8/fz//f79//3+/f/+/v7//////////////////v7+//z9/P/9/v3////////////4+/f/qMqj/0ePPf8ygyb/QYw2/z+KNP8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/QIs2/zODKP+81rj///////v8+v/9/v3//f79//3+/f/9/v3//f79//3+/f/9/v3//f79//3+/f/9/vz//P38//z9/P/9/v3////////////+//7//////+vz6v+myaH/VZhL/zCCJP87iDD/QYw2/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/0CLNf8zgyj/wNi8///////8/fz///////////////////////////////////////////////////////////////////////3+/f/l7+P/t9Oz/3uvdP9Gjzv/MIIl/ziHLf9BjDb/P4s0/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/9AizX/NYQp/6HGnP/l7+T/2ejX/9vp2f/b6dn/2+nZ/9vp2f/b6dn/2+nZ/9vp2f/a6Nj/1OXS/8jdxf+10rH/ncSY/36xd/9enVX/Qow3/zKCJv8ygyb/PIkx/0GMNv8/izT/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/87iDD/PIgx/zyIMf88iDH/PIgx/zyIMf88iDH/PIgx/zyIMf88iTH/O4gw/ziGLf81hCn/MYIm/zCCJP8ygyb/N4Yr/z2JMv9BjDb/QYw2/z+KNP8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/P4o0/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8/izT/QIs1/0GMNv9BjDb/QYw2/0CLNf8+ijT/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/Pooz/z6KM/8+ijP/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=
// @downloadURL  https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/TM%20Translate.user.js
// @updateURL    https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/TM%20Translate.user.js
// @match        *://*/*
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// @grant        GM_openInTab
// @grant        GM_deleteValue
// @connect      unpkg.com
// @connect      cdn.jsdelivr.net
// @connect      raw.githubusercontent.com
// @connect      dichngay.com
// @connect      github.com
// @connect      ghfast.top
// @connect      githubusercontent.com
// @connect      objects.githubusercontent.com
// @connect      drive.usercontent.google.com
// @connect      api.dichnhanh.com
// @connect      release-assets.githubusercontent.com
// @require      https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/translate/zh_to_vi/translateZhToVi.js
// @require      https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js
// @require      https://unpkg.com/fflate@0.8.2/umd/index.js
// @require      https://unpkg.com/@oovz/esearch-ocr/dist/eSearchOCR.umd.js
// @require      https://unpkg.com/onnxruntime-web@1.22.0/dist/ort.wasm.min.js
// @require      https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js
// ==/UserScript==

/* global chrome */

(function () {
    'use strict';

    const SERVER_PROVIDER_DEFAULTS = {
        dichngay: 'https://dichngay.com/translate/text',
        dichnhanh: 'https://api.dichnhanh.com/'
    };

    /* ================== DEFAULT CONFIG ================== */
    const DEFAULT_CONFIG = {
        translationMode: 'server',
        serverUrl: 'https://dichngay.com/translate/text',
        serverEndpoints: {
            ...SERVER_PROVIDER_DEFAULTS
        },
        serverProvider: 'dichngay', // 'dichngay' | 'dichnhanh'
        dichnhanhOptions: {
            mode: 'vi', // vi | qt | hv
            type: 'Ancient', // Ancient | Modern
            enableAnalyze: false,
            enableFanfic: false
        },
        targetLang: 'vi',
        delayMs: 400,
        maxCharsPerRequest: 4500,
        includeScriptStyle: false,
        activeNameSet: 'Mặc định',
        nameSets: {
            'Mặc định': {
            }
        },
        hanvietJsonUrl: 'https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/han_viet/output.json',
        simplifiedEnabled: false,
        simplifiedBlockJS: true,
        simplifiedShowOriginal: false,
        simplifiedStyle: {
            fontFamily: "Noto Serif, 'Times New Roman', serif",
            fontSize: 21,
            lineHeight: 1.9,
            bgColor: '#fdfdf6',
            textColor: '#1f1f1f',
            textAlign: 'justify'
        },
        overrideFontEnabled: false,
        overrideFontFamily: "Noto Serif, 'Times New Roman', serif",
        showOcrButton: true,
        ocrMode: 'overlay', // 'popup' | 'overlay' (Output Mode)
        ocrActionMode: 'region', // 'region' (Khoanh vùng) | 'image' (Dịch ảnh) - NEW
        ocrImageSource: 'screen', // 'screen' (Toàn màn hình) | 'import' (File/URL) - NEW
        ocrFont: 'Noto Serif', // Default font for OCR overlay
        ocrTextScaleFactor: 1.8, // Factor tinh chỉnh kích thước chữ OCR (Càng lớn chữ càng nhỏ)
        showStartButton: true,
        showQuickTranslateButton: true,
        showRestoreButton: true,
        autoTranslateOnScroll: true,
        nameEditingEnabled: true,
        allowCopyWhenEditing: true,
        blacklist: [], // Thêm dòng này
    };
    let updateOcrStatus = null;

    /* ================== STORAGE ================== */
    function loadConfig() {
        const c = GM_getValue('tm_translate_config_v2');
        if (!c) {
            GM_setValue('tm_translate_config_v2', DEFAULT_CONFIG);
            return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
        }
        const merged = { ...DEFAULT_CONFIG, ...c };
        merged.nameSets = { ...DEFAULT_CONFIG.nameSets, ...(c.nameSets || {}) };
        if (!merged.activeNameSet || !merged.nameSets[merged.activeNameSet]) {
            merged.activeNameSet = Object.keys(merged.nameSets)[0] || 'Mặc định';
        }
        merged.simplifiedStyle = { ...DEFAULT_CONFIG.simplifiedStyle, ...(c.simplifiedStyle || {}) };
        merged.serverEndpoints = { ...SERVER_PROVIDER_DEFAULTS, ...(c.serverEndpoints || {}) };
        if (c.serverUrl && !merged.serverEndpoints.dichngay) {
            merged.serverEndpoints.dichngay = c.serverUrl;
        }
        if (!merged.serverEndpoints.dichnhanh) {
            merged.serverEndpoints.dichnhanh = SERVER_PROVIDER_DEFAULTS.dichnhanh;
        }
        merged.serverUrl = merged.serverEndpoints.dichngay || SERVER_PROVIDER_DEFAULTS.dichngay;
        merged.dichnhanhOptions = {
            ...DEFAULT_CONFIG.dichnhanhOptions,
            ...(c.dichnhanhOptions || {})
        };
        merged.blacklist = c.blacklist || [];
        return merged;
    }
    function saveConfig(cfg) { GM_setValue('tm_translate_config_v2', cfg); }
    let config = loadConfig();

    /* ================== GLOBAL STATE ================== */
    let translationCache = {};
    let isTranslating = false;
    let lastTranslationState = null; // { items, placeholderMaps, translatedResults }
    let hanvietMap = null;
    let lastSelectionRange = null;
    let simplifiedActive = false;
    let originalBodyElement = null; // Giữ body gốc để khôi phục không cần reload
    let originalScrollPosition = 0;
    let originalBodyClone = null; // Stores body before simplified view is enabled
    let translatedBodyClone = null; // Stores body *after* translation

    /* ================== UTILITIES ================== */
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    function escapeHtml(s) {
        return String(s || '')
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    function unescapeHtml(s) { return (s || '').toString().replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'); }
    function capitalizeFirstLetter(s) {
        if (typeof s !== 'string' || !s) return s;
        return s.replace(/(^|[\.?!])(\s*["'“‘(\[]*)(\p{L})/gu, (match, p1, p2, p3) => {
            return p1 + p2 + p3.toUpperCase();
        });
    }
    /* ================== FANQIE NOVEL DECODING ================== */
    const fontMapFanqieLibrary = { 'E4B0': '0', 'E54F': '1', 'E4E7': '2', 'E504': '3', 'E49E': '4', 'E4F6': '5', 'E556': '6', 'E53C': '7', 'E47A': '8', 'E474': '9', 'E40D': 'a', 'E51C': 'b', 'E487': 'c', 'E436': 'd', 'E51A': 'e', 'E43B': 'f', 'E485': 'g', 'E4BA': 'h', 'E478': 'i', 'E445': 'j', 'E52F': 'k', 'E49A': 'l', 'E425': 'm', 'E4DB': 'n', 'E40B': 'o', 'E3FF': 'p', 'E488': 'q', 'E47B': 'r', 'E407': 's', 'E558': 't', 'E46B': 'u', 'E543': 'v', 'E417': 'w', 'E48F': 'x', 'E3E9': 'y', 'E52A': 'z', 'E428': 'A', 'E4C1': 'B', 'E481': 'C', 'E43E': 'D', 'E44A': 'E', 'E4D3': 'F', 'E43C': 'G', 'E4CB': 'H', 'E4E8': 'I', 'E410': 'J', 'E429': 'K', 'E4E6': 'L', 'E557': 'M', 'E51D': 'N', 'E3FC': 'O', 'E455': 'P', 'E470': 'Q', 'E4B2': 'R', 'E44E': 'S', 'E435': 'T', 'E41B': 'U', 'E4B4': 'V', 'E4EE': 'W', 'E4BB': 'X', 'E467': 'Y', 'E4B9': 'Z', 'E3F3': '的', 'E526': '一', 'E456': '是', 'E517': '了', 'E40E': '我', 'E511': '不', 'E41C': '人', 'E53F': '在', 'E54D': '他', 'E4C0': '有', 'E473': '这', 'E4FB': '个', 'E54A': '上', 'E453': '们', 'E528': '来', 'E44F': '到', 'E42B': '时', 'E440': '大', 'E480': '地', 'E4C2': '为', 'E53D': '子', 'E42C': '中', 'E489': '你', 'E47C': '说', 'E4A5': '生', 'E42A': '国', 'E4C5': '年', 'E548': '着', 'E443': '就', 'E553': '那', 'E47F': '和', 'E420': '要', 'E406': '她', 'E4C8': '出', 'E3FE': '也', 'E41F': '得', 'E4A8': '里', 'E534': '后', 'E4C4': '自', 'E4DF': '以', 'E51F': '会', 'E4E2': '家', 'E502': '可', 'E438': '下', 'E551': '而', 'E539': '过', 'E54C': '天', 'E44D': '去', 'E498': '能', 'E52C': '对', 'E431': '小', 'E45B': '多', 'E4A4': '然', 'E501': '于', 'E46C': '心', 'E4D5': '学', 'E42E': '么', 'E541': '之', 'E500': '都', 'E4FE': '好', 'E52E': '看', 'E448': '起', 'E45E': '发', 'E49B': '当', 'E427': '没', 'E545': '成', 'E464': '只', 'E41D': '如', 'E459': '事', 'E458': '把', 'E4D6': '还', 'E4FF': '用', 'E4F9': '第', 'E48C': '样', 'E450': '道', 'E54B': '想', 'E465': '作', 'E4B5': '种', 'E4FC': '开', 'E524': '美', 'E48D': '总', 'E512': '从', 'E457': '无', 'E40A': '情', 'E52D': '己', 'E441': '面', 'E404': '最', 'E50B': '女', 'E4DC': '但', 'E3EB': '现', 'E466': '前', 'E51B': '些', 'E4CF': '所', 'E503': '同', 'E508': '日', 'E49D': '手', 'E43F': '又', 'E559': '行', 'E4D8': '意', 'E4B6': '动', 'E4CD': '方', 'E4C3': '期', 'E44C': '它', 'E493': '头', 'E469': '经', 'E52B': '长', 'E521': '儿', 'E4AA': '回', 'E4F8': '位', 'E4D7': '分', 'E3F6': '爱', 'E3FD': '老', 'E531': '因', 'E4F4': '很', 'E446': '给', 'E49C': '名', 'E409': '法', 'E439': '间', 'E422': '斯', 'E3F5': '知', 'E53A': '世', 'E510': '什', 'E523': '两', 'E505': '次', 'E48A': '使', 'E4EB': '身', 'E4D1': '者', 'E525': '被', 'E4BF': '高', 'E41A': '已', 'E4B3': '亲', 'E4DA': '其', 'E546': '进', 'E515': '此', 'E3EE': '话', 'E400': '常', 'E50A': '与', 'E461': '活', 'E4CC': '正', 'E4CE': '感', 'E4F5': '见', 'E4D0': '明', 'E433': '问', 'E4A2': '力', 'E3FB': '理', 'E468': '尔', 'E4B1': '点', 'E550': '文', 'E403': '几', 'E542': '定', 'E4A9': '本', 'E527': '公', 'E4BD': '特', 'E4BC': '做', 'E460': '外', 'E463': '孩', 'E532': '相', 'E45A': '西', 'E475': '果', 'E42D': '走', 'E408': '将', 'E3F0': '月', 'E3EA': '十', 'E449': '实', 'E432': '向', 'E4A1': '声', 'E43A': '车', 'E472': '全', 'E509': '信', 'E49F': '重', 'E519': '三', 'E514': '机', 'E4FA': '工', 'E3F1': '物', 'E53B': '气', 'E413': '每', 'E50E': '并', 'E554': '别', 'E4AB': '真', 'E536': '打', 'E412': '太', 'E45F': '新', 'E4DD': '比', 'E520': '才', 'E3ED': '便', 'E51E': '夫', 'E4EF': '再', 'E540': '书', 'E50F': '部', 'E3F2': '水', 'E486': '像', 'E522': '眼', 'E46F': '等', 'E3E8': '体', 'E3EF': '却', 'E454': '加', 'E424': '电', 'E405': '主', 'E45C': '界', 'E423': '门', 'E418': '利', 'E4F2': '海', 'E415': '受', 'E4ED': '听', 'E3F9': '表', 'E555': '德', 'E421': '少', 'E401': '克', 'E4A6': '代', 'E411': '员', 'E530': '许', 'E4D2': '稜', 'E47E': '先', 'E430': '口', 'E4E0': '由', 'E4E1': '死', 'E476': '安', 'E444': '写', 'E490': '性', 'E4C6': '马', 'E40C': '光', 'E4F3': '白', 'E513': '或', 'E4D4': '住', 'E55B': '难', 'E414': '望', 'E416': '教', 'E4B8': '命', 'E499': '花', 'E537': '结', 'E496': '乐', 'E533': '色', 'E4D9': '更', 'E544': '拉', 'E549': '东', 'E437': '神', 'E518': '记', 'E491': '处', 'E4E3': '让', 'E479': '母', 'E46E': '父', 'E495': '应', 'E4F7': '直', 'E4A0': '字', 'E484': '场', 'E402': '平', 'E4EC': '报', 'E4A3': '友', 'E497': '关', 'E3F4': '放', 'E4CA': '至', 'E482': '张', 'E4C7': '认', 'E4C9': '接', 'E46D': '告', 'E4AC': '入', 'E50C': '笑', 'E4A7': '内', 'E4B7': '英', 'E419': '军', 'E55A': '候', 'E471': '民', 'E4FD': '岁', 'E535': '往', 'E42F': '何', 'E43D': '度', 'E4F1': '山', 'E4DE': '觉', 'E552': '路', 'E547': '带', 'E3F7': '万', 'E426': '男', 'E4BE': '边', 'E3FA': '风', 'E462': '解', 'E4EA': '叫', 'E47D': '任', 'E4E9': '金', 'E3EC': '快', 'E4F0': '原', 'E452': '吃', 'E54E': '妈', 'E41E': '变', 'E447': '通', 'E4AD': '师', 'E529': '立', 'E4AE': '象', 'E451': '数', 'E506': '四', 'E4E4': '失', 'E50D': '满', 'E483': '战', 'E442': '远', 'E538': '格', 'E4E5': '士', 'E492': '音', 'E434': '轻', 'E48E': '目', 'E53E': '条', 'E40F': '呢', };
    const fontMapFanqieSearch = { 'E436': '0', 'E420': '1', 'E516': '2', 'E40D': '3', 'E3F3': '4', 'E553': '5', 'E4A2': '6', 'E4AA': '7', 'E53D': '8', 'E42F': '9', 'E4F6': 'a', 'E4FC': 'b', 'E477': 'c', 'E454': 'd', 'E532': 'e', 'E4A7': 'f', 'E426': 'g', 'E407': 'h', 'E4E9': 'i', 'E482': 'j', 'E554': 'k', 'E46B': 'l', 'E492': 'm', 'E54C': 'n', 'E4EE': 'o', 'E51A': 'p', 'E4D6': 'q', 'E523': 'r', 'E3E9': 's', 'E555': 't', 'E427': 'u', 'E46A': 'v', 'E408': 'w', 'E4B2': 'x', 'E4A1': 'y', 'E47E': 'z', 'E46C': 'A', 'E3F1': 'B', 'E4FE': 'C', 'E4E2': 'D', 'E4A3': 'E', 'E4DE': 'F', 'E415': 'G', 'E533': 'H', 'E4EF': 'I', 'E48C': 'J', 'E419': 'K', 'E45C': 'L', 'E42C': 'M', 'E423': 'N', 'E469': 'O', 'E455': 'P', 'E550': 'Q', 'E497': 'R', 'E462': 'S', 'E522': 'T', 'E3F4': 'U', 'E49D': 'V', 'E4B4': 'W', 'E4CA': 'X', 'E481': 'Y', 'E429': 'Z', 'E456': '的', 'E4B5': '一', 'E474': '是', 'E488': '了', 'E4D5': '我', 'E520': '不', 'E4D2': '人', 'E3ED': '在', 'E3EE': '他', 'E557': '有', 'E546': '这', 'E4DB': '个', 'E4A6': '上', 'E3F8': '们', 'E461': '来', 'E4B3': '到', 'E4E8': '时', 'E513': '大', 'E552': '地', 'E4C8': '为', 'E47F': '子', 'E40C': ' 中', 'E514': '你', 'E425': '说', 'E4B7': '生', 'E467': '国', 'E40A': '年', 'E507': '着', 'E47A': '就', 'E491': '那', 'E517': '和', 'E412': '要', 'E509': '她', 'E510': '出', 'E4DF': '也', 'E478': '得', 'E465': '里', 'E4C3': '后', 'E46F': '自', 'E4C5': '以', 'E558': '会', 'E4E6': '家', 'E496': '可', 'E54E': '下', 'E4C2': '而', 'E480': '过', 'E531': '天', 'E4F4': '去', 'E3EF': '能', 'E4DA': '对', 'E4C1': '小', 'E404': '多', 'E4F2': '然', 'E40F': '于', 'E46D': '心', 'E4D0': '学', 'E485': '么', 'E4CF': '之', 'E548': '都', 'E475': '好', 'E50F': '看', 'E542': '起', 'E4E7': '发', 'E4ED': '当', 'E48F': '没', 'E4B6': '成', 'E51D': '只', 'E49E': '如', 'E540': '事', 'E53B': '把', 'E4E4': '还', 'E54A': '用', 'E44E': '第', 'E51B': '样', 'E44D': '道', 'E4AD': '想', 'E3EB': '作', 'E479': '种', 'E4BC': '开', 'E42B': '美', 'E527': '总', 'E52F': '从', 'E470': '无', 'E4F9': '情', 'E41E': '己', 'E416': '面', 'E51F': '最', 'E451': '女', 'E4BA': '但', 'E49A': '现', 'E466': '前', 'E468': '些', 'E486': '所', 'E414': '同', 'E4C0': '日', 'E545': '手', 'E54F': '又', 'E42D': '行', 'E47B': '意', 'E400': '动', 'E418': '方', 'E428': '期', 'E448': '它', 'E53F': '头', 'E499': '经', 'E4AB': '长', 'E45B': '儿', 'E45F': '回', 'E4CE': '位', 'E417': '分', 'E528': '爱', 'E4F7': '老', 'E4E5': '因', 'E4A5': '很', 'E42E': '给', 'E489': '名', 'E54B': '法', 'E444': '间', 'E498': '斯', 'E52C': '知', 'E422': '世', 'E41A': '什', 'E432': '两', 'E409': '次', 'E44C': '使', 'E529': '身', 'E3FF': '者', 'E4DC': '被', 'E3FB': '高', 'E450': '已', 'E4F8': '亲', 'E401': '其', 'E521': '进', 'E43B': '此', 'E4AE': '话', 'E442': '常', 'E519': '与', 'E3FE': '活', 'E3F7': '正', 'E50D': '感', 'E446': '见', 'E49C': '明', 'E45E': '问', 'E503': '力', 'E500': '理', 'E3FD': '尔', 'E543': '点', 'E430': '文', 'E4C7': '几', 'E443': '定', 'E41D': '本', 'E4F5': '公', 'E40E': '特', 'E524': '做', 'E42A': '外', 'E447': '孩', 'E511': '相', 'E4A9': '西', 'E559': '果', 'E49F': '走', 'E431': '将', 'E4A8': '月', 'E410': '十', 'E50B': '实', 'E439': '向', 'E3FA': '声', 'E494': '车', 'E3FC': '全', 'E4B8': '信', 'E4D9': '重', 'E4C6': '三', 'E4B1': '机', 'E50A': '工', 'E506': '物', 'E441': '气', 'E493': '每', 'E3F0': '并', 'E4DD': '别', 'E544': '真', 'E440': '打', 'E4FB': '太', 'E51C': '新', 'E4F0': '比', 'E3F6': '才', 'E51E': '便', 'E4AC': '夫', 'E41B': '再', 'E4E0': '书', 'E490': '部', 'E44F': '水', 'E43A': '像', 'E48E': '眼', 'E421': '等', 'E4FA': '体', 'E476': '却', 'E52E': '加', 'E4FF': ' 电', 'E402': '主', 'E549': '界', 'E49B': '门', 'E55A': '利', 'E4B0': '海', 'E48B': '受', 'E535': '听', 'E483': '表', 'E4EC': '德', 'E43E': '少', 'E3F5': '克', 'E473': '代', 'E4CC': '员', 'E433': '许', 'E4E1': '稜', 'E47C': '先', 'E3EC': '口', 'E537': '由', 'E4CB': '死', 'E43D': '安', 'E4E3': '写', 'E459': '性', 'E4BF': '马', 'E472': '光', 'E43C': '白', 'E4EA': '或', 'E4EB': '住', 'E547': '难', 'E405': '望', 'E41C': '教', 'E4A0': '命', 'E445': '花', 'E41F': '结', 'E4D7': '乐', 'E50C': '色', 'E504': '更', 'E505': '拉', 'E4BE': '东', 'E460': '神', 'E50E': '记', 'E54D': '处', 'E53A': '让', 'E526': '母', 'E4BB': '父', 'E438': '应', 'E449': '直', 'E3F9': '字', 'E536': '场', 'E46E': '平', 'E403': '报', 'E435': '友', 'E458': '关', 'E406': '放', 'E541': '至', 'E434': '张', 'E4C9': '认', 'E487': '接', 'E551': '告', 'E411': '入', 'E4B9': '笑', 'E4BD': '内', 'E437': '英', 'E471': '军', 'E515': '候', 'E55B': '民', 'E556': '岁', 'E52D': '往', 'E43F': '何', 'E495': '度', 'E452': '山', 'E4F1': '觉', 'E512': '路', 'E4C4': '带', 'E4FD': '万', 'E413': '男', 'E539': '边', 'E44A': '风', 'E453': '解', 'E45A': '叫', 'E53C': '任', 'E48A': '金', 'E538': '快', 'E508': '原', 'E4F3': '吃', 'E45D': '妈', 'E4AF': '变', 'E457': '通', 'E52A': '师', 'E47D': '立', 'E4D8': '象', 'E44B': '数', 'E464': '四', 'E502': '失', 'E48D': '满', 'E4A4': '战', 'E4D1': '远', 'E525': '格', 'E3F2': '士', 'E4D3': '音', 'E52B': '轻', 'E4CD': '目', 'E53E': '条', 'E4D4': '呢', };
    function decodeFanqieGeneralText(text, pageID) {
        let fontMap = {};
        if (pageID === "search") {
            fontMap = fontMapFanqieSearch;
        } else if (pageID === "library") {
            fontMap = fontMapFanqieLibrary
        }
        if (!text) return text;
        let result = '';
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const hexCode = char.charCodeAt(0).toString(16).toUpperCase();
            result += fontMap[hexCode] || char;
        }
        return result;
    }

    function decodeFanqieReaderText(text) {
        const CODE_ST = 58344, CODE_ED = 58715;
        const CHARSET = ['D', '在', '主', '特', '家', '军', '然', '表', '场', '4', '要', '只', 'v', '和', '?', '6', '别', '还', 'g', '现', '儿', '岁', '?', '?', '此', '象', '月', '3', '出', '战', '工', '相', 'o', '男', '首', '失', '世', 'F', '都', '平', '文', '什', 'V', 'O', '将', '真', 'T', '那', '当', '?', '会', '立', '些', 'u', '是', '十', '张', '学', '气', '大', '爱', '两', '命', '全', '后', '东', '性', '通', '被', '1', '它', '乐', '接', '而', '感', '车', '山', '公', '了', '常', '以', '何', '可', '话', '先', 'p', 'i', '叫', '轻', 'M', '士', 'w', '着', '变', '尔', '快', 'l', '个', '说', '少', '色', '里', '安', '花', '远', '7', '难', '师', '放', 't', '报', '认', '面', '道', 'S', '?', '克', '地', '度', 'I', '好', '机', 'U', '民', '写', '把', '万', '同', '水', '新', '没', '书', '电', '吃', '像', '斯', '5', '为', 'y', '白', '几', '日', '教', '看', '但', '第', '加', '候', '作', '上', '拉', '住', '有', '法', 'r', '事', '应', '位', '利', '你', '声', '身', '国', '问', '马', '女', '他', 'Y', '比', '父', 'x', 'A', 'H', 'N', 's', 'X', '边', '美', '对', '所', '金', '活', '回', '意', '到', 'z', '从', 'j', '知', '又', '内', '因', '点', 'Q', '三', '定', '8', 'R', 'b', '正', '或', '夫', '向', '德', '听', '更', '?', '得', '告', '并', '本', 'q', '过', '记', 'L', '让', '打', 'f', '人', '就', '者', '去', '原', '满', '体', '做', '经', 'K', '走', '如', '孩', 'c', 'G', '给', '使', '物', '?', '最', '笑', '部', '?', '员', '等', '受', 'k', '行', '一', '条', '果', '动', '光', '门', '头', '见', '往', '自', '解', '成', '处', '天', '能', '于', '名', '其', '发', '总', '母', '的', '死', '手', '入', '路', '进', '心', '来', 'h', '时', '力', '多', '开', '己', '许', 'd', '至', '由', '很', '界', 'n', '小', '与', 'Z', '想', '代', '么', '分', '生', '口', '再', '妈', '望', '次', '西', '风', '种', '带', 'J', '?', '实', '情', '才', '这', '?', 'E', '我', '神', '格', '长', '觉', '间', '年', '眼', '无', '不', '亲', '关', '结', '0', '友', '信', '下', '却', '重', '己', '老', '2', '音', '字', 'm', '呢', '明', '之', '前', '高', 'P', 'B', '目', '太', 'e', '9', '起', '稜', '她', '也', 'W', '用', '方', '子', '英', '每', '理', '便', '西', '数', '期', '中', 'C', '外', '样', 'a', '海', '们', '任'];
        let decodedText = "";
        for (let i = 0; i < text.length; i++) {
            const code = text.charCodeAt(i);
            if (CODE_ST <= code && code <= CODE_ED) {
                decodedText += CHARSET[code - CODE_ST] || text[i];
            } else {
                decodedText += text[i];
            }
        }
        return decodedText;
    }

    function injectGlobalCSS() {
        if (document.getElementById('tm-global-styles')) return;

        const css = `
        :root {
            --tm-primary: #007bff; --tm-dark: #343a40; --tm-light: #f8f9fa;
            --tm-white: #ffffff; --tm-border-color: #dee2e6; --tm-shadow: 0 8px 25px rgba(0,0,0,0.15);
            --tm-font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        .tm-float-btn {
            position: fixed; width: 48px; height: 48px; border-radius: 50%; color: var(--tm-white);
            display: flex; align-items: center; justify-content: center; z-index: 2147483640;
            cursor: pointer; box-shadow: var(--tm-shadow); transition: all 0.2s ease-in-out;
        }
        .tm-float-btn:hover { transform: scale(1.1); }
        #tm-edit-pencil { right: 18px; bottom: 18px; background-color: var(--tm-primary); }
        #tm-style-button { right: 18px; bottom: 80px; background-color: var(--tm-dark); }
        .tm-modal-wrapper {
            position: fixed; inset: 0; z-index: 2147483645;
            display: flex; align-items: center; justify-content: center; font-family: var(--tm-font);
        }
        .tm-modal-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.5); }
        .tm-modal-box {
            position: relative; background: var(--tm-white); padding: 0; border-radius: 12px;
            box-shadow: var(--tm-shadow); max-width: 95vw; max-height: 90vh;
            display: flex; flex-direction: column; overflow: hidden;
        }
        .tm-modal-header { padding: 12px 20px; border-bottom: 1px solid var(--tm-border-color); display: flex; justify-content: space-between; align-items: center; }
        .tm-modal-header h2, .tm-modal-header h3 { margin: 0; font-size: 1.2rem; }
        .tm-modal-content { padding: 20px; overflow-y: auto; color: var(--tm-dark); } /* SỬA ĐỔI: Thêm màu chữ mặc định */
        .tm-modal-footer { padding: 12px 20px; border-top: 1px solid var(--tm-border-color); display: flex; justify-content: flex-end; gap: 8px; background-color: var(--tm-light); }
        .tm-btn { padding: 8px 16px; border-radius: 6px; border: 1px solid #ccc; background: #f7f7f7; cursor: pointer; transition: background 0.2s; font-size: 14px; }
        .tm-btn:hover { background: #e9e9e9; }
        .tm-btn-primary { background: var(--tm-primary); color: white; border-color: var(--tm-primary); }
        .tm-btn-primary:hover { background: #0056b3; }
        .tm-input, .tm-select, .tm-textarea { width: 100%; padding: 8px 12px; border: 1px solid var(--tm-border-color); border-radius: 6px; margin-top: 4px; margin-bottom: 12px; box-sizing: border-box; font-size: 14px; }
        .tm-label { font-weight: 600; font-size: 14px; display: block; margin-bottom: 4px; }
        .tm-row { display: flex; gap: 16px; }
        .tm-col { flex: 1; }
        .tm-tabs-nav { display: flex; border-bottom: 1px solid var(--tm-border-color); background: var(--tm-light); }
        .tm-tab-btn { padding: 12px 20px; cursor: pointer; border: none; background: none; font-size: 15px; }
        .tm-tab-btn.active { background: var(--tm-white); border-bottom: 3px solid var(--tm-primary); }
        .tm-tab-content { display: none; }
        .tm-tab-content.active { display: block; }
        #tm-style-panel .tm-modal-box { width: 340px; }
        .tm-bg-swatch { width: 32px; height: 32px; border: 1px solid #ddd; cursor: pointer; border-radius: 50%; transition: transform 0.2s; }
        .tm-bg-swatch:hover { transform: scale(1.1); }
        .tm-bg-swatch.active { box-shadow: 0 0 0 3px var(--tm-primary); }
        #tm-simplified-container { padding: 30px 5%; min-height: 100vh; box-sizing: border-box; }
        #tm-simplified-container p { margin-bottom: 1.2em; }
        #tm-simplified-topbar { max-width: 800px; margin: 0 auto 24px auto; display: flex; justify-content: space-between; align-items: center; padding-bottom: 16px; border-bottom: 1px solid rgba(128,128,128,0.3); }
        .tm-preview-box { border: 1px solid var(--tm-border-color); padding: 8px; min-height: 200px; max-height: 400px; overflow: auto; background: #fafafa; border-radius: 6px; color: var(--tm-dark); } /* SỬA ĐỔI: Thêm màu chữ */
        #tm-loading-indicator { position: fixed; top: 10px; left: 50%; transform: translateX(-50%); background: var(--tm-dark); color: white; padding: 10px 20px; border-radius: 8px; z-index: 2147483647; font-size: 16px; box-shadow: var(--tm-shadow); }
    `;
        const styleEl = document.createElement('style');
        styleEl.id = 'tm-global-styles';
        styleEl.textContent = css;
        document.head.appendChild(styleEl);
    }

    function unlockPageInteraction() {
        const css = '*, :after, :before { -webkit-user-select: text !important; -moz-user-select: text !important; -ms-user-select: text !important; user-select: text !important; cursor: auto !important; }';
        removeElementById('tm-unlock-style');
        const style = document.createElement('style');
        style.id = 'tm-unlock-style';
        style.type = 'text/css';
        style.appendChild(document.createTextNode(css));
        (document.head || document.documentElement).appendChild(style);

        const eventsToNullify = [
            'oncontextmenu', 'onselectstart', 'ondragstart', 'onmousedown', 'onkeydown'
        ];
        document.querySelectorAll('*').forEach(el => {
            eventsToNullify.forEach(eventName => {
                if (el[eventName]) el[eventName] = null;
            });
        });

        const eventsToStop = [
            'contextmenu', 'selectstart', 'dragstart', 'mousedown', 'keydown', 'copy', 'cut'
        ];
        const interceptor = (e) => {
            e.stopPropagation();
        };
        eventsToStop.forEach(event => {
            document.addEventListener(event, interceptor, { capture: true });
        });

        try {
            if (typeof window.jQuery === 'function') {
                window.jQuery(document).off('contextmenu');
                window.jQuery('body').off('contextmenu');
            }
        } catch (e) { /* Bỏ qua nếu có lỗi */ }

        console.log('[tm-translate] Đã kích hoạt chế độ giải phóng chuột và tô đen văn bản.');
    }

    function applyGlobalFontOverride() {
        removeElementById('tm-font-override-style');

        if (!config.overrideFontEnabled) {
            return;
        }

        const css = `
        body, body *, p, div, span, a, li, td, th {
            font-family: ${config.overrideFontFamily} !important;
        }
    `;
        const style = document.createElement('style');
        style.id = 'tm-font-override-style';
        style.textContent = css;
        (document.head || document.documentElement).appendChild(style);

        console.log(`[tm-translate] Đã áp dụng font chữ ghi đè: ${config.overrideFontFamily}`);
    }
    /* ================== DOM MANIPULATION & UI HELPERS ================== */
    function applyCopyabilityStyle() {
        if (config.nameEditingEnabled && config.allowCopyWhenEditing) {
            unlockPageInteraction();
        } else {
            removeElementById('tm-unlock-style');
            console.log('[tm-translate] Đã tắt chế độ can thiệp copy.');
        }
    }

    function showLoading(message) {
        removeLoading();
        const div = document.createElement('div');
        div.id = 'tm-loading-indicator';
        div.textContent = message;
        document.body.appendChild(div);
    }
    function removeLoading() {
        const el = document.getElementById('tm-loading-indicator');
        if (el) el.remove();
    }

    function updateFloatingButtons() {
        removeElementById('tm-start-translate-btn');
        removeElementById('tm-edit-pencil');
        removeElementById('tm-style-button');
        removeElementById('tm-quick-translate-btn');
        removeElementById('tm-restore-original-btn');
        removeElementById('tm-ocr-float-btn');
        removeStylePanel();

        let bottomOffset = 18;

        if (config.showQuickTranslateButton) {
            const quickBtn = document.createElement('div');
            quickBtn.id = 'tm-quick-translate-btn';
            quickBtn.className = 'tm-float-btn';
            quickBtn.title = 'Bảng dịch nhanh';
            quickBtn.style.right = '18px';
            quickBtn.style.bottom = `${bottomOffset}px`;
            quickBtn.style.backgroundColor = '#6c757d'; // Màu xám
            quickBtn.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 11H7V9h2v2zm4 0h-2V9h2v2zm4 0h-2V9h2v2z"/></svg>`;
            quickBtn.addEventListener('click', showQuickTranslatePanel);
            document.body.appendChild(quickBtn);
            document.body.appendChild(quickBtn);
            bottomOffset += 64;
        }

        if (config.showOcrButton) {
            const ocrBtn = document.createElement('div');
            ocrBtn.id = 'tm-ocr-float-btn';
            ocrBtn.className = 'tm-float-btn';
            ocrBtn.title = 'OCR Vùng chọn (Dịch hình ảnh)';
            ocrBtn.style.right = '18px';
            ocrBtn.style.bottom = `${bottomOffset}px`;
            ocrBtn.style.backgroundColor = '#17a2b8'; // Teal
            ocrBtn.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8V6a2 2 0 0 1 2-2h2"/><path d="M4 16v2a2 2 0 0 0 2 2h2"/><path d="M16 4h2a2 2 0 0 1 2 2v2"/><path d="M16 20h2a2 2 0 0 0 2-2v-2"/><path d="M10 10l4 4m0-4l-4 4"/></svg>`;
            ocrBtn.addEventListener('click', handleOcrButtonClick);
            document.body.appendChild(ocrBtn);
            bottomOffset += 64;
        }

        if (!translatedBodyClone && config.showStartButton) {
            const startBtn = document.createElement('div');
            startBtn.id = 'tm-start-translate-btn';
            startBtn.className = 'tm-float-btn';
            startBtn.style.backgroundColor = '#28a745';
            startBtn.style.right = '18px';
            startBtn.style.bottom = `${bottomOffset}px`;
            startBtn.title = 'Bắt đầu dịch trang này';
            startBtn.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M21.79,6.22C20.21,4.64,18,4,15.5,4c-2.12,0-3.88,0.64-5.23,1.93L12,7.66l1.41,1.41l-2.42,2.42l-2.42-2.42L10,7.66 C10,7.66,10,7.66,10,7.66L8.59,6.24C7.7,5.36,6.58,4.8,5.25,4.8C4.19,4.8,3.2,5.1,2.4,5.9C0.83,7.47,0.83,10,2.4,11.6l4.24,4.24 c0.78,0.78,1.8,1.17,2.83,1.17s2.05-0.39,2.83-1.17l1.41-1.41l-1.41-1.41L12,14.34l-1.06-1.06c-0.39-0.39-0.39-1.02,0-1.41 s1.02-0.39,1.41,0l1.06,1.06l2.42-2.42l1.41,1.41l-1.41,1.41c-1.56,1.56-4.09,1.56-5.66,0l-4.24-4.24c-1.17-1.17-1.17-3.07,0-4.24 c0.75-0.75,1.76-1.12,2.83-1.12s2.08,0.38,2.83,1.12l1.41,1.41L12,7.66l2.42,2.42l1.41-1.41L14.41,7.24c1.35-1.29,3.11-1.93,5.23-1.93 c2.5,0,4.71,0.64,6.29,2.21c1.56,1.56,1.56,4.09,0,5.66l-2.12,2.12l-1.41-1.41l2.12-2.12C22.96,10.32,22.96,7.79,21.79,6.22z"/></svg>`;
            startBtn.addEventListener('click', startTranslateAction);
            document.body.appendChild(startBtn);
            bottomOffset += 64;
        } else if (translatedBodyClone && config.nameEditingEnabled) {
            // Nút "Sửa tên" (màu xanh dương)
            const pencil = document.createElement('div');
            pencil.id = 'tm-edit-pencil';
            pencil.className = 'tm-float-btn';
            pencil.title = 'Sửa tên (chọn chữ rồi bấm)';
            pencil.style.right = '18px';
            pencil.style.bottom = `${bottomOffset}px`;
            pencil.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
            pencil.addEventListener('mousedown', () => {
                const sel = window.getSelection();
                if (sel.rangeCount > 0) lastSelectionRange = sel.getRangeAt(0).cloneRange();
            });
            pencil.addEventListener('click', (event) => {
                event.preventDefault();
                openEditModalForSelection();
            });
            document.body.appendChild(pencil);
            bottomOffset += 64;
        }

        if (translatedBodyClone && !simplifiedActive && config.showRestoreButton !== false) {
            const restoreBtn = document.createElement('div');
            restoreBtn.id = 'tm-restore-original-btn';
            restoreBtn.className = 'tm-float-btn';
            restoreBtn.title = 'Quay về trang gốc';
            restoreBtn.style.right = '18px';
            restoreBtn.style.top = '18px'; // Đặt lên góc phải trên để tránh trùng với các nút khác
            restoreBtn.style.backgroundColor = '#ffc107';
            restoreBtn.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M5 11h10l-3.29-3.29L13.12 6.3 19 12l-5.88 5.7-1.41-1.41L15 13H5z"/></svg>`;
            restoreBtn.addEventListener('click', restoreOriginalPage);
            document.body.appendChild(restoreBtn);
        }

        if (simplifiedActive) {
            const styleBtn = document.createElement('div');
            styleBtn.id = 'tm-style-button';
            styleBtn.className = 'tm-float-btn';
            styleBtn.title = 'Tùy chỉnh Giao diện đọc';
            styleBtn.style.right = '18px';
            styleBtn.style.bottom = `${bottomOffset}px`;
            styleBtn.style.backgroundColor = 'var(--tm-dark)';
            styleBtn.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18M5 7h14M5 17h14"/></svg>`;
            styleBtn.addEventListener('click', toggleStylePanel);
            document.body.appendChild(styleBtn);
        }
    }

    function removeElementById(id) { document.getElementById(id)?.remove(); }
    function removeFloatingButtons() {
        removeElementById('tm-start-translate-btn');
        removeElementById('tm-edit-pencil');
        removeElementById('tm-style-button');
        removeElementById('tm-quick-translate-btn');
        removeElementById('tm-restore-original-btn');
        removeElementById('tm-ocr-float-btn');
        removeStylePanel();
    }

    function updateStartButtonVisibility() {
        if (config.showStartButton) {
            updateFloatingButtons();
        } else {
            removeElementById('tm-start-translate-btn');
        }
    }

    function restoreOriginalPage() {
        if (!originalBodyClone && !originalBodyElement) {
            alert('Không tìm thấy bản sao trang gốc để khôi phục. Vui lòng tải lại trang.');
            return;
        }

        stopAutoTranslateObserver();

        const sourceBody = originalBodyElement || originalBodyClone;
        const restoredBody = originalBodyElement ? sourceBody : (sourceBody.cloneNode ? sourceBody.cloneNode(true) : sourceBody);
        document.body.replaceWith(restoredBody);

        originalBodyElement = restoredBody;
        originalBodyClone = restoredBody.cloneNode ? restoredBody.cloneNode(true) : restoredBody;
        translatedBodyClone = null;
        lastTranslationState = null;
        simplifiedActive = false;
        isTranslating = false;

        document.documentElement.style.backgroundColor = '';
        document.body.style.backgroundColor = '';
        document.body.style.color = '';
        document.body.style.margin = '';
        document.body.style.padding = '';

        removeElementById('tm-font-override-style');
        removeElementById('tm-unlock-style');
        removeElementById('tm-simplified-dynamic-style');
        removeElementById('tm-simplified-style');
        removeStylePanel();
        removeLoading();

        setTimeout(() => {
            window.scrollTo(0, originalScrollPosition || 0);
        }, 0);

        updateFloatingButtons();
    }

    /* ================== SELECTION TRACKING ================== */
    document.addEventListener('selectionchange', () => {
        try {
            const sel = window.getSelection();
            if (!sel || sel.rangeCount === 0) return;
            const r = sel.getRangeAt(0);
            if (r && !r.collapsed && r.toString().trim()) {
                lastSelectionRange = r.cloneRange();
                lastSelectionRange._textSnapshot = r.toString();
            }
        } catch (e) { /* ignore */ }
    });

    document.addEventListener('click', function delegatedEditStyle(e) {
        const btn = e.target.closest('.tm-edit-style-btn') || e.target.closest('#editStyleBtn') || e.target.closest('[data-tm-action="edit-style"]');
        if (!btn) return;

        e.preventDefault();
        e.stopPropagation();

        try {
            const sel = window.getSelection();
            if ((!sel || sel.toString().trim().length === 0) && window._lastSelectionSnapshot) {
                const s2 = window.getSelection();
                s2.removeAllRanges();
                s2.addRange(window._lastSelectionSnapshot);
            }
        } catch (err) { /* ignore */ }

        const candidateFns = [
            'openEditStyleModal',
            'openStyleModal',
            'openStyleEditor',
            'openEditModalForStyle',
            'openEditModalForSelection',
        ];

        let called = false;
        for (const name of candidateFns) {
            try {
                const fn = window[name];
                if (typeof fn === 'function') {
                    fn(btn); // truyền btn nếu hàm cần tham số
                    called = true;
                    break;
                }
            } catch (e) { /* ignore */ }
        }

        if (!called) {
            const ev = new CustomEvent('tm:edit-style-clicked', { detail: { button: btn } });
            document.dispatchEvent(ev);
            console.warn('Không tìm thấy hàm edit-style; phát event tm:edit-style-clicked để lắng nghe thay thế.');
        }
    });

    document.addEventListener('selectionchange', function saveSelectionSnapshot() {
        try {
            const s = window.getSelection();
            if (s && s.rangeCount) window._lastSelectionSnapshot = s.getRangeAt(0).cloneRange();
        } catch (e) { }
    });


    /* ================== CORE TRANSLATION LOGIC ================== */

    function collectTranslatableItems(includeScriptStyle = false, roots = [document.body]) {
        const items = [];
        const seenNodes = new WeakSet();
        const skipTags = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'PRE', 'CODE', 'TEXTAREA'];
        const ignoreRootIds = ['tm-edit-pencil', 'tm-style-button', 'tm-edit-modal', 'tm-settings-modal', 'tm-style-panel'];
        const isFanqie = window.location.hostname.includes('fanqienovel.com');
        const hasMeaningfulTextRegex = isFanqie ? /\S/ : /[a-zA-Z\u4e00-\u9fa5\d]/;

        function isIgnored(element) {
            if (!element || seenNodes.has(element)) return true;
            let cur = element;
            while (cur) {
                if (cur.nodeType !== 1) {
                    cur = cur.parentElement;
                    continue;
                }
                if (cur.classList && (cur.classList.contains('tm-chunk') || cur.classList.contains('tm-parent-translated'))) {
                    return true;
                }
                if (cur.id && ignoreRootIds.some(id => cur.id.startsWith(id))) return true;
                if (cur.isContentEditable) return true;
                if (!includeScriptStyle && skipTags.includes(cur.nodeName.toUpperCase())) return true;
                cur = cur.parentElement;
            }
            return false;
        }

        function traverse(node) {
            if (isIgnored(node)) return;

            if (node.nodeType === Node.ELEMENT_NODE && node.tagName.toUpperCase() === 'A') {
                const href = node.getAttribute('href');
                const text = node.textContent.trim();
                if (href && text && hasMeaningfulTextRegex.test(text)) {
                    items.push({ type: 'link', href: href, original: text, node: node });
                    seenNodes.add(node);
                    return;
                }
            }

            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.nodeValue.trim();
                if (text.length > 0 && hasMeaningfulTextRegex.test(text)) {
                    items.push({ type: 'text', node: node, original: text });
                    seenNodes.add(node);
                }
                return;
            }

            if (node.nodeType === Node.ELEMENT_NODE) {
                const attrsToTranslate = ['title', 'placeholder', 'value'];
                for (const attr of attrsToTranslate) {
                    const text = node.getAttribute(attr)?.trim();
                    if (text && text.length > 0 && hasMeaningfulTextRegex.test(text)) {
                        items.push({ type: 'attribute', element: node, attribute: attr, original: text });
                    }
                }
                seenNodes.add(node);

                for (const child of Array.from(node.childNodes)) {
                    traverse(child);
                }
            }
        }

        roots.forEach(root => traverse(root));
        console.log(`[tm-translate] Đã thu thập được ${items.length} mục mới để dịch.`);
        return items;
    }

    function buildNameSetReplacer(nameSet) {
        const keys = Object.keys(nameSet).sort((a, b) => b.length - a.length);
        return function (text, placeholderMap) {
            let out = text;
            for (const k of keys) {
                if (!k) continue;
                if (out.includes(k)) {
                    const id = `__TM_NAME_${Object.keys(placeholderMap).length}__`;
                    placeholderMap[id] = { orig: k, viet: nameSet[k] };
                    out = out.split(k).join(id);
                }
            }
            return out;
        };
    }

    function restoreNames(text, placeholderMap) {
        if (!text || !placeholderMap) return text;
        let result = text;
        for (const placeholder in placeholderMap) {
            const regex = new RegExp(placeholder.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
            result = result.replace(regex, placeholderMap[placeholder].viet + ' ');
        }
        result = result.replace(/\s+([,.;!?\)]|”|’|:)/g, '$1');
        result = result.replace(/([\(\[“‘])\s+/g, '$1');
        result = result.replace(/\s+/g, ' ');
        return result.trim();
    }

    function splitIntoBatches(arr, maxChars) {
        const batches = []; let cur = [], curLen = 0;
        for (const s of arr) {
            const s_len = s?.length || 0;
            if (curLen + s_len + cur.length > maxChars && cur.length > 0) {
                batches.push(cur);
                cur = [s];
                curLen = s_len;
            } else {
                cur.push(s);
                curLen += s_len;
            }
        }
        if (cur.length) batches.push(cur);
        return batches;
    }

    function ensureServerEndpointStore() {
        if (!config.serverEndpoints) {
            config.serverEndpoints = { ...SERVER_PROVIDER_DEFAULTS };
        }
        if (!config.serverEndpoints.dichngay) config.serverEndpoints.dichngay = SERVER_PROVIDER_DEFAULTS.dichngay;
        if (!config.serverEndpoints.dichnhanh) config.serverEndpoints.dichnhanh = SERVER_PROVIDER_DEFAULTS.dichnhanh;
    }
    function getServerEndpoint(provider) {
        ensureServerEndpointStore();
        const fallback = SERVER_PROVIDER_DEFAULTS[provider] || SERVER_PROVIDER_DEFAULTS.dichngay;
        return config.serverEndpoints[provider] || fallback;
    }
    function getDichnhanhOptions() {
        const opts = config.dichnhanhOptions || DEFAULT_CONFIG.dichnhanhOptions;
        return {
            mode: ['vi', 'qt', 'hv'].includes(opts?.mode) ? opts.mode : 'vi',
            type: opts?.type === 'Modern' ? 'Modern' : 'Ancient',
            enableAnalyze: !!opts?.enableAnalyze,
            enableFanfic: !!opts?.enableFanfic
        };
    }

    function postTranslate(serverUrl, contentArray, targetLang) {
        return new Promise((resolve, reject) => {
            const payload = { content: JSON.stringify(contentArray), tl: targetLang };

            GM_xmlhttpRequest({
                method: 'POST',
                url: serverUrl,
                headers: { 'Content-Type': 'application/json', 'referer': 'https://dichngay.com/' },
                data: JSON.stringify(payload),
                onload(res) {
                    if (res.status >= 200 && res.status < 300) {
                        try {
                            const jsonResponse = JSON.parse(res.responseText);
                            let translatedContentString = jsonResponse?.data?.content ?? jsonResponse?.translatedText;

                            if (typeof translatedContentString !== 'string') {
                                throw new Error("Server response 'content' was not a string.");
                            }

                            const sanitizedString = translatedContentString
                                .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
                                .replace(/\\(?!["\\\/bfnrtu])/g, '\\\\');

                            resolve(JSON.parse(sanitizedString));

                        } catch (e) {
                            console.error("Lỗi nghiêm trọng khi parse JSON từ server:", e);
                            reject(new Error('Failed to parse response from server. Error: ' + e));
                        }
                    } else {
                        reject(new Error('HTTP Error: ' + res.status));
                    }
                },
                onerror(err) { reject(err); }
            });
        });
    }

    function postTranslateDichnhanh(contentArray, dnOptions, endpointUrl) {
        return new Promise((resolve, reject) => {
            if (!Array.isArray(contentArray) || contentArray.length === 0) {
                resolve([]);
                return;
            }
            const normalizedOpts = getDichnhanhOptions();
            const opts = { ...normalizedOpts, ...(dnOptions || {}) };
            opts.mode = ['vi', 'qt', 'hv'].includes(opts.mode) ? opts.mode : 'vi';
            opts.type = opts.type === 'Modern' ? 'Modern' : 'Ancient';
            const enableAnalyze = opts.enableAnalyze ? '1' : '0';
            const enableFanfic = opts.enableFanfic ? '1' : '0';
            const serializedTexts = contentArray.map(text => JSON.stringify(String(text ?? ''))).join(',');
            const params = new URLSearchParams({
                type: opts.type,
                enable_analyze: enableAnalyze,
                enable_fanfic: enableFanfic,
                mode: opts.mode,
                text: serializedTexts,
                remove: ''
            });
            const apiUrl = (endpointUrl || SERVER_PROVIDER_DEFAULTS.dichnhanh);
            GM_xmlhttpRequest({
                method: 'POST',
                url: apiUrl,
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.3',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'referer': 'https://dichnhanh.com/'
                },
                data: params.toString(),
                onload(res) {
                    if (res.status < 200 || res.status >= 300) {
                        reject(new Error('HTTP Error: ' + res.status));
                        return;
                    }
                    try {
                        const jsonResponse = JSON.parse(res.responseText || '{}');
                        if (jsonResponse.success !== true) {
                            throw new Error(jsonResponse.message || 'API trả về lỗi.');
                        }
                        const rawContent = jsonResponse?.data?.content;
                        if (typeof rawContent !== 'string') {
                            throw new Error('Không nhận được dữ liệu hợp lệ từ dichnhanh.com');
                        }

                        let sanitizedContent = rawContent
                            .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
                            .replace(/\"/g, '"')
                            .replace(/'/g, '"')
                            .trim();

                        let parsed = [];
                        parsed = JSON.parse(`[${sanitizedContent}]`);

                        resolve(parsed);
                    } catch (e) {
                        reject(new Error('Lỗi parse dữ liệu dichnhanh.com: ' + e.message));
                    }
                },
                onerror(err) { reject(err); }
            });
        });
    }

    function decodeDichnhanhEscape(str, index) {
        const next = str[index + 1];
        if (next === 'u' && index + 5 < str.length) {
            const hex = str.slice(index + 2, index + 6);
            if (/^[0-9a-fA-F]{4}$/.test(hex)) {
                return { char: String.fromCharCode(parseInt(hex, 16)), advance: 6 };
            }
        }
        const map = { n: '\n', r: '\r', t: '\t', '"': '"', "'": "'", '\\': '\\' };
        return { char: map[next] ?? next, advance: 2 };
    }

    async function requestServerTranslation(contentArray) {
        const provider = (config.serverProvider || 'dichngay');
        const endpoint = getServerEndpoint(provider);
        if (provider === 'dichnhanh') {
            return await postTranslateDichnhanh(contentArray, config.dichnhanhOptions, endpoint);
        }
        return await postTranslate(endpoint, contentArray, config.targetLang);
    }

    function highlightNamesInText(translatedText, nameSet) {
        const vietToOrigMap = {};
        for (const orig in nameSet) {
            const vietName = nameSet[orig];
            if (vietName) {
                vietToOrigMap[vietName.toLowerCase()] = orig;
            }
        }

        const vietNames = Object.keys(vietToOrigMap);
        if (vietNames.length === 0) {
            return escapeHtml(translatedText);
        }

        const namePattern = vietNames
            .map(name => name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'))
            .join('|');
        const regex = new RegExp(`(${namePattern})`, 'gi');

        return escapeHtml(translatedText).replace(regex, (matchedText) => {
            const lowerCaseMatch = matchedText.toLowerCase();
            const origName = vietToOrigMap[lowerCaseMatch];

            if (origName) {
                return `<span class="tm-name" data-orig="${escapeHtml(origName)}">${matchedText}</span>`;
            }

            return matchedText;
        });
    }



    function tokenizeString(str) {
        if (!str) return [];
        const specialCharsRegex = /([^a-zA-Z0-9\u4e00-\u9fa5\s。，、？！：；“”‘’（）《》]+)/g;
        const parts = str.split(specialCharsRegex).filter(Boolean);
        const tokens = [];
        for (const part of parts) {
            if (/([^a-zA-Z0-9\u4e00-\u9fa5\s。，、？！：；“”‘’（）《》]+)/.test(part)) {
                tokens.push({ type: 'special', value: part });
            } else {
                if (tokens.length > 0 && tokens[tokens.length - 1].type === 'text') {
                    tokens[tokens.length - 1].value += part;
                } else {
                    tokens.push({ type: 'text', value: part });
                }
            }
        }
        return tokens;
    }

    function reassembleTranslatedString(tokens, translatedTexts) {
        let result = '';
        let translatedIndex = 0;
        for (const token of tokens) {
            if (token.type === 'text') {
                if (!token.value || !token.value.trim()) {
                    result += token.value || '';
                    continue;
                }
                if (translatedIndex < translatedTexts.length) {
                    result += translatedTexts[translatedIndex];
                    translatedIndex++;
                } else {
                    result += token.value;
                }
            } else {
                result += token.value;
            }
        }
        return result;
    }

    async function translatePanelText(fullInput, returnType = 'html') {
        config = loadConfig();
        const nameSet = config.nameSets[config.activeNameSet] || {};
        const nameReplacer = buildNameSetReplacer(nameSet);
        const placeholderMap = {};

        const paragraphs = fullInput.split(/\r?\n/);
        const textsToSend = [];
        const chunks = [];

        for (const para of paragraphs) {
            if (!para.trim()) {
                chunks.push({ isEmpty: true });
                continue;
            }

            const decodedText = para;
            const tokens = tokenizeString(decodedText);
            const textsForThisPara = [];

            tokens.forEach(token => {
                if (token.type === 'text' && token.value.trim()) {
                    const processedText = nameReplacer(token.value, placeholderMap);
                    textsForThisPara.push(processedText);
                }
            });

            textsToSend.push(...textsForThisPara);
            chunks.push({ original: para, tokens: tokens, numTextTokens: textsForThisPara.length });
        }

        if (textsToSend.length === 0) return returnType === 'html' ? '<p style="color:#888;">Không có gì để dịch.</p>' : '';

        const batches = splitIntoBatches(textsToSend, config.maxCharsPerRequest);
        let allTranslatedTexts = [];

        if (config.translationMode === 'local') {
            await initializeLocalTranslator();
            for (const batch of batches) {
                allTranslatedTexts.push(...batch.map(text => TranslateZhToVi.translateSentence(text)));
            }
        } else {
            for (let b = 0; b < batches.length; b++) {
                const translatedBatch = await requestServerTranslation(batches[b]);
                allTranslatedTexts.push(...(translatedBatch || []));
                if (b < batches.length - 1) await sleep(config.delayMs);
            }
        }

        let translationIdx = 0;
        let finalResult = '';
        let resultArray = [];

        for (const chunk of chunks) {
            if (chunk.isEmpty) {
                if (returnType === 'html') finalResult += '<p><br></p>';
                else resultArray.push(''); // Dòng trống
                continue;
            }

            const translatedParts = allTranslatedTexts.slice(translationIdx, translationIdx + chunk.numTextTokens);
            const reassembledText = reassembleTranslatedString(chunk.tokens, translatedParts);
            const finalRestoredText = restoreNames(reassembledText, placeholderMap);
            const capitalizedText = capitalizeFirstLetter(finalRestoredText);

            if (returnType === 'html') {
                const highlightedHtml = highlightNamesInText(capitalizedText, nameSet);
                const chunkHtml = `<span class="tm-chunk" data-orig="${escapeHtml(chunk.original)}">${highlightedHtml}</span>`;
                finalResult += `<p>${chunkHtml}</p>`;
            } else {
                // Với text thuần, ta chỉ lấy text đã xử lý name, không highlight HTML
                resultArray.push(capitalizedText);
            }

            translationIdx += chunk.numTextTokens;
        }

        return returnType === 'html' ? finalResult : resultArray.join('\n');
    }

    async function startTranslateAction() {
        if (isTranslating) {
            showNotification("Đang dịch, vui lòng đợi...", 2000);
            return;
        }
        isTranslating = true;
        removeElementById('tm-start-translate-btn');

        try {
            originalBodyElement = document.body;
            originalScrollPosition = window.scrollY || document.documentElement.scrollTop || 0;
            originalBodyClone = document.body.cloneNode(true);
            showLoading('Đang thu thập nội dung...');
            config = loadConfig();
            const items = collectTranslatableItems(config.includeScriptStyle, [originalBodyClone]);
            if (items.length === 0) throw new Error('Không tìm thấy nội dung để dịch.');

            // Phần Tokenize và dịch đã ổn định, giữ nguyên
            const nameSet = config.nameSets[config.activeNameSet] || {};
            const nameReplacer = buildNameSetReplacer(nameSet);
            const placeholderMap = {}; // Bản đồ chứa các tên đã thay thế cho toàn bộ trang

            const textsToSend = [];
            const itemsToTranslate = [];
            const hostname = window.location.hostname;
            const pathname = window.location.pathname;
            items.forEach(item => {
                item.decodedOriginal = item.original; // Mặc định gán bản gốc
                if (hostname.includes('fanqienovel.com')) {
                    if (pathname.startsWith('/reader/')) {
                        item.decodedOriginal = decodeFanqieReaderText(item.original);
                    } else if (pathname.startsWith('/search/')) {
                        item.decodedOriginal = decodeFanqieGeneralText(item.original, "search");
                    } else {
                        item.decodedOriginal = decodeFanqieGeneralText(item.original, "library");
                    }
                }
                item.tokens = tokenizeString(item.decodedOriginal);

                const hasCached = Object.prototype.hasOwnProperty.call(translationCache, item.decodedOriginal) && translationCache[item.decodedOriginal];
                if (hasCached) {
                    item.translated = translationCache[item.decodedOriginal];
                    return;
                }

                let numTextTokens = 0;
                item.tokens.forEach(token => {
                    if (token.type === 'text' && token.value.trim()) {
                        const processedText = nameReplacer(token.value, placeholderMap);
                        textsToSend.push(processedText);
                        numTextTokens++;
                    }
                });
                item._numTextTokens = numTextTokens;
                itemsToTranslate.push(item);
            });

            const batches = splitIntoBatches(textsToSend, config.maxCharsPerRequest);
            showLoading(`Đang dịch... (0/${batches.length} gói)`);
            let allTranslatedTexts = [];
            showLoading(`Đang dịch... (0/${batches.length} gói)`);
            if (config.translationMode === 'local') {
                await initializeLocalTranslator(); // Đảm bảo thư viện đã sẵn sàng
                for (let b = 0; b < batches.length; b++) {
                    showLoading(`Đang dịch local... (${b + 1}/${batches.length} gói)`);
                    const batchToTranslate = batches[b];
                    const translatedBatch = batchToTranslate.map(text => TranslateZhToVi.translateSentence(text));
                    allTranslatedTexts.push(...translatedBatch);
                    // Không cần delay khi dịch local vì nó rất nhanh
                }
            } else {
                // Chế độ server (code gốc)
                for (let b = 0; b < batches.length; b++) {
                    showLoading(`Đang dịch server... (${b + 1}/${batches.length} gói)`);
                    const translatedBatch = await requestServerTranslation(batches[b]);
                    allTranslatedTexts.push(...(translatedBatch || []));
                    if (b < batches.length - 1) await sleep(config.delayMs);
                }
            }

            let translationIdx = 0;
            itemsToTranslate.forEach(item => {
                const numTextTokens = item._numTextTokens || item.tokens.filter(t => t.type === 'text' && t.value.trim()).length;
                const translatedParts = allTranslatedTexts.slice(translationIdx, translationIdx + numTextTokens);
                const reassembledText = reassembleTranslatedString(item.tokens, translatedParts);

                item.translated = restoreNames(reassembledText, placeholderMap);

                translationIdx += numTextTokens;
                if (item.decodedOriginal && item.translated) {
                    translationCache[item.decodedOriginal] = item.translated;
                }
                delete item._numTextTokens;
            });
            console.log(`Dịch toàn trang hoàn tất. Đã cache ${Object.keys(translationCache).length} mục.`);

            lastTranslationState = { items };
            showLoading('Đang áp dụng bản dịch...');
            translatedBodyClone = originalBodyClone.cloneNode(true);
            const itemsInClone = collectTranslatableItems(config.includeScriptStyle, [translatedBodyClone]);

            for (let i = 0; i < itemsInClone.length; i++) {
                const itemInClone = itemsInClone[i];
                const originalItem = items[i];

                if (!originalItem?.translated) continue;

                originalItem.translated = capitalizeFirstLetter(originalItem.translated);

                if (itemInClone.type === 'attribute') {
                    itemInClone.element.setAttribute(itemInClone.attribute, originalItem.translated);
                }
                else if (itemInClone.node && itemInClone.node.parentNode) {
                    const nameSet = config.nameSets[config.activeNameSet] || {};
                    const highlightedHtml = highlightNamesInText(originalItem.translated, nameSet);

                    if (config.nameEditingEnabled) {
                        const chunkSpan = document.createElement('span');
                        chunkSpan.className = 'tm-chunk';
                        chunkSpan.dataset.orig = originalItem.decodedOriginal;
                        chunkSpan.innerHTML = highlightedHtml;

                        if (itemInClone.type === 'link') {
                            itemInClone.node.innerHTML = '';
                            itemInClone.node.appendChild(chunkSpan);
                        } else {
                            itemInClone.node.parentNode.replaceChild(chunkSpan, itemInClone.node);
                        }
                    } else {
                        if (itemInClone.type === 'link') {
                            const parent = itemInClone.node.parentNode;
                            if (parent && parent.nodeType === 1) {
                                parent.setAttribute('title', `${originalItem.decodedOriginal}`);
                            }
                            itemInClone.node.innerHTML = highlightedHtml;
                        } else {
                            const parent = itemInClone.node.parentNode;
                            if (parent && parent.nodeType === 1) {
                                parent.setAttribute('title', `${originalItem.decodedOriginal}`);
                            }
                            const tempWrapper = document.createElement('div');
                            tempWrapper.innerHTML = highlightedHtml;
                            while (tempWrapper.firstChild) {
                                parent.insertBefore(tempWrapper.firstChild, itemInClone.node);
                            }
                            parent.removeChild(itemInClone.node);
                        }
                    }
                }
            }

            removeLoading();

            if (config.simplifiedEnabled) {
                console.log('[tm-translate] Dịch hoàn tất. Đang kích hoạt chế độ rút gọn...');
                enableSimplifiedView();
            } else {
                // Nếu không, thì mới thay thế body như bình thường.
                console.log('[tm-translate] Dịch hoàn tất. Đang áp dụng lên trang gốc...');
                document.body.replaceWith(translatedBodyClone.cloneNode(true));
                // Các hàm này chỉ nên chạy ở chế độ thường
                applyGlobalFontOverride();
                startAutoTranslateObserver();
            }

            // Các hàm này chạy cho cả hai trường hợp
            applyCopyabilityStyle();
            updateFloatingButtons();
            console.log('[tm-translate] Quy trình hoàn tất.');

        } catch (err) {
            removeLoading();
            console.error('[tm-translate] Lỗi nghiêm trọng:', err);
            alert('Đã xảy ra lỗi nghiêm trọng: ' + err.message);
        } finally {
            isTranslating = false;
        }
    }
    /* ================== SIMPLIFIED VIEW ================== */
    function findMainContentElement(translatedBody) {
        console.log("Bắt đầu tìm khối nội dung chính...");
        let bestCandidate = null;
        let maxTextLength = -1;

        const selectors = ['article', 'main', '#novel_content', '#content', '.entry-content', 'body'];

        for (const selector of selectors) {
            const elements = translatedBody.querySelectorAll(selector);
            for (const container of elements) {
                // Chỉ xét các element có thể nhìn thấy
                if (container.offsetParent === null && container.tagName !== 'BODY') continue;

                const text = container.textContent.trim();
                if (text.length > maxTextLength) {
                    maxTextLength = text.length;
                    bestCandidate = container;
                }
            }
            // Nếu đã tìm thấy một ứng viên tốt từ các selector ưu tiên, có thể dừng sớm
            if (bestCandidate && selector !== 'body') {
                console.log(`Tìm thấy ứng viên tốt nhất bằng selector '${selector}':`, bestCandidate);
                return bestCandidate;
            }
        }

        if (bestCandidate) {
            console.log(`Khối nội dung chính được chọn có ${maxTextLength} ký tự.`, bestCandidate);
            return bestCandidate;
        }

        // Fallback cuối cùng, không thể xảy ra nhưng để an toàn
        console.warn("Không tìm thấy khối nội dung chính, trả về body.");
        return translatedBody;
    }

    function splitBySentenceHeuristic(text) {
        const regex = /([^。！？!?\.]+[。！？!?\.…]?)/g;
        const parts = text.match(regex);
        if (!parts) return [text];
        return parts.map(p => p.trim()).filter(Boolean);
    }

    function splitByLength(text, maxLen = 120) {
        const out = [];
        let s = (text || '').trim();
        while (s.length > maxLen) {
            let idx = s.lastIndexOf(' ', maxLen);
            if (idx <= 0) idx = maxLen;
            out.push(s.slice(0, idx).trim());
            s = s.slice(idx).trim();
        }
        if (s.length) out.push(s);
        return out;
    }

    function endsWithNonSpace(html) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html || '';
        const txt = tmp.textContent || '';
        return /\S$/.test(txt);
    }

    function startsWithNonSpaceNode(node) {
        if (!node) return false;
        const txt = (node.textContent || '').trimLeft();
        return txt.length > 0 && /\S/.test(txt[0]);
    }

    function injectSimplifiedCSS() {
        if (document.getElementById('tm-simplified-style')) return;
        const css = `
    .tm-simplified * { white-space: normal !important; word-break: normal !important;
      overflow-wrap: break-word !important; -webkit-hyphens: none !important; hyphens: none !important; }
    .tm-simplified p { margin: 1.2em 0; line-height: 1.8; }
  `;
        const s = document.createElement('style');
        s.id = 'tm-simplified-style';
        s.textContent = css;
        document.head.appendChild(s);
    }

    function buildSimplifiedHtml(translatedItems) {
        let html = '';
        const nameSet = config.nameSets[config.activeNameSet] || {};
        const showOriginal = config.simplifiedShowOriginal || false;

        translatedItems.forEach(item => {
            if (item.type !== 'text' && item.type !== 'link') return;

            const originalTextToShow = item.decodedOriginal || item.original;

            const finalTranslatedText = capitalizeFirstLetter((item.translated || '').trim());

            let p = document.createElement('p');
            let finalContent;

            if (showOriginal) {
                finalContent = document.createTextNode(originalTextToShow);
            } else {
                if (config.nameEditingEnabled) {
                    const chunkSpan = document.createElement('span');
                    chunkSpan.className = 'tm-chunk';
                    chunkSpan.dataset.orig = originalTextToShow;
                    chunkSpan.innerHTML = highlightNamesInText(finalTranslatedText, nameSet);
                    finalContent = chunkSpan;
                } else {
                    finalContent = document.createTextNode(finalTranslatedText);
                }
            }

            // Đưa nội dung cuối cùng vào thẻ <a> nếu là link, hoặc <p> nếu là text thường
            if (item.type === 'link' && item.href) {
                const a = document.createElement('a');
                a.href = escapeHtml(item.href);
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                a.appendChild(finalContent);
                p.appendChild(a);
            } else {
                p.appendChild(finalContent);
            }

            html += p.outerHTML + '\n';
        });
        return html;
    }

    function enableSimplifiedView() {
        if (simplifiedActive) {
            applySimplifiedStyle();
            return;
        }
        if (!lastTranslationState || !lastTranslationState.items) {
            alert("Chưa có nội dung dịch để hiển thị. Vui lòng dịch trang trước.");
            return;
        }

        if (config.simplifiedBlockJS) {
            console.log('[tm-translate] Chặn JS được bật. Đang dọn dẹp script và event...');
            document.querySelectorAll('script, iframe').forEach(el => el.remove());
            const allElements = document.querySelectorAll('*');
            allElements.forEach(el => {
                for (const attr of el.attributes) {
                    if (attr.name.startsWith('on')) {
                        el.removeAttribute(attr.name);
                    }
                }
            });
        }

        document.head.querySelectorAll('link[rel="stylesheet"], style').forEach(el => {
            if (!el.src?.includes('tampermonkey') && !el.id.startsWith('tm-')) {
                el.remove();
            }
        });

        injectGlobalCSS();
        const cleanContentHtml = buildSimplifiedHtml(lastTranslationState.items);

        document.body.innerHTML = '';
        document.body.className = '';
        document.body.innerHTML = `
        <div id="tm-simplified-container">
            <div id="tm-simplified-topbar">
                <div style="font-weight:700; font-size: 1.1rem;">Chế độ đọc rút gọn</div>
                <button id="tm-simplified-exit" class="tm-btn">Thoát</button>
            </div>
            <div id="tm-simplified-content">${cleanContentHtml}</div>
        </div>
    `;

        document.getElementById('tm-simplified-exit').addEventListener('click', disableSimplifiedView);

        simplifiedActive = true;
        applySimplifiedStyle();
        updateFloatingButtons();
    }

    function applySimplifiedStyle() {
        const s = config.simplifiedStyle;

        document.documentElement.style.backgroundColor = s.bgColor;
        document.body.style.backgroundColor = s.bgColor;
        document.body.style.color = s.textColor;
        document.body.style.margin = '0';
        document.body.style.padding = '0';

        removeElementById('tm-simplified-dynamic-style');

        const linkColor = s.bgColor.includes('292a2d') ? '#79c0ff' : '#0056b3';

        const dynamicCSS = `
        #tm-simplified-container {
            padding: 30px 5% !important;
            box-sizing: border-box !important;
        }
        #tm-simplified-content {
            max-width: 800px;
            margin: 0 auto;
        }
        /* Áp dụng style lên tất cả các thẻ P, DIV bên trong để đảm bảo tính nhất quán */
        #tm-simplified-content p, #tm-simplified-content div {
            font-family: ${s.fontFamily} !important;
            font-size: ${s.fontSize}px !important;
            line-height: ${s.lineHeight} !important;
            text-align: ${s.textAlign} !important;
            color: ${s.textColor} !important;
            background: none !important;
            margin: 0.8em 0 !important;
            padding: 0 !important;
            border: 0 !important;
        }
        #tm-simplified-content a {
            color: ${linkColor} !important;
            text-decoration: none !important;
        }
        #tm-simplified-content a:hover {
            text-decoration: underline !important;
        }
    `;

        const styleEl = document.createElement('style');
        styleEl.id = 'tm-simplified-dynamic-style';
        styleEl.textContent = dynamicCSS;
        document.head.appendChild(styleEl);
    }
    function disableSimplifiedView() {
        if (!simplifiedActive) return;
        console.log("Đang thoát chế độ rút gọn...");

        //     if (originalBodyClone) {
        //         // Tắt các style đã áp dụng lên <html>
        //         document.documentElement.style.backgroundColor = '';

        //         // Hoàn toàn thay thế body hiện tại bằng bản sao gốc đã lưu
        //         document.body.replaceWith(originalBodyClone.cloneNode(true));

        //         // Reset trạng thái và tái tạo lại các nút bấm
        //         simplifiedActive = false;
        //         removeFloatingButtons(); // Xóa các nút cũ (nút style)
        //         updateFloatingButtons(); // Tạo lại các nút mới (chỉ nút edit)

        //         // Phục hồi lại selection handler
        //         document.addEventListener('selectionchange', () => {
        //              try {
        //                 const sel = window.getSelection();
        //                 if (!sel || sel.rangeCount === 0) return;
        //                 const r = sel.getRangeAt(0);
        //                 if (r && !r.collapsed && r.toString().trim()) {
        //                     lastSelectionRange = r.cloneRange();
        //                     lastSelectionRange._textSnapshot = r.toString();
        //                 }
        //             } catch (e) { /* ignore */ }
        //         });

        //     } else {
        // Fallback an toàn nhất nếu không có bản sao
        location.reload();
        //}
    }

    /* ================== AUTO TRANSLATE NEW CONTENT ================== */

    function showNotification(message, duration = 2000) {
        removeElementById('tm-notification-bubble');
        const div = document.createElement('div');
        div.id = 'tm-notification-bubble';
        div.textContent = message;
        div.style.cssText = `
        position: fixed; top: 20px; right: 20px; background-color: #2c3e50;
        color: white; padding: 10px 18px; border-radius: 25px;
        z-index: 2147483647; font-size: 14px; box-shadow: var(--tm-shadow);
        opacity: 0; transition: opacity 0.3s ease;
    `;
        document.body.appendChild(div);
        setTimeout(() => { div.style.opacity = '1'; }, 10);
        setTimeout(() => {
            div.style.opacity = '0';
            setTimeout(() => { div.remove(); }, 300);
        }, duration);
    }
    function applyTranslationToDom(items) {
        const nameSet = config.nameSets[config.activeNameSet] || {};

        for (const it of items) {
            if (!it.translated) continue;

            // Chuẩn hóa và viết hoa trước
            it.translated = capitalizeFirstLetter(it.translated.trim());

            if (it.type === 'attribute') {
                if (it.element && it.element.isConnected) {
                    it.element.setAttribute(it.attribute, it.translated);
                }
            }
            else if (it.node?.isConnected && it.node.parentNode) {
                const highlightedHtml = highlightNamesInText(it.translated, nameSet);

                // Nếu type === 'link', it.node chính là thẻ <a> (không phải text node)
                const isLinkElement = it.type === 'link';

                if (config.nameEditingEnabled) {
                    const chunkSpan = document.createElement('span');
                    chunkSpan.className = 'tm-chunk';
                    chunkSpan.dataset.orig = it.decodedOriginal;

                    chunkSpan.innerHTML = highlightedHtml;

                    if (isLinkElement) {
                        // Nếu it.node là thẻ <a>, thay thế toàn bộ nội dung bên trong
                        it.node.innerHTML = '';
                        it.node.appendChild(chunkSpan);
                    } else {
                        // Trường hợp text node thông thường
                        it.node.parentNode.replaceChild(chunkSpan, it.node);
                    }
                } else {
                    const parent = it.node.parentNode;
                    if (parent && parent.nodeType === 1) {
                        parent.setAttribute('title', `Dịch từ: ${it.decodedOriginal.trim()}`);
                    }

                    if (isLinkElement) {
                        // Nếu it.node là thẻ <a>, thay thế nội dung HTML của nó
                        it.node.innerHTML = highlightedHtml;
                    } else {
                        // Text node thông thường: thêm content vào parent của text node
                        const tempWrapper = document.createElement('div');
                        tempWrapper.innerHTML = highlightedHtml;
                        while (tempWrapper.firstChild) {
                            parent.insertBefore(tempWrapper.firstChild, it.node);
                        }
                        parent.removeChild(it.node);
                    }
                }
            }
        }
    }
    async function translateNewNodes(nodes) {
        // Tạm dừng observer để tránh vòng lặp vô tận
        if (window.tmTranslateObserver) window.tmTranslateObserver.disconnect();

        const allNewItems = collectTranslatableItems(config.includeScriptStyle, nodes);
        if (!allNewItems.length) {
            // Nếu không có gì để dịch, bật lại observer và thoát
            if (window.tmTranslateObserver) window.tmTranslateObserver.observe(document.body, { childList: true, subtree: true });
            return;
        }

        // 1. Luôn tạo thuộc tính 'decodedOriginal' cho tất cả các item mới
        allNewItems.forEach(item => {
            item.decodedOriginal = item.original; // Mặc định
            const hostname = window.location.hostname;
            const pathname = window.location.pathname;
            if (hostname.includes('fanqienovel.com')) {
                if (pathname.startsWith('/reader/')) {
                    item.decodedOriginal = decodeFanqieReaderText(item.original);
                } else if (pathname.startsWith('/search/')) {
                    item.decodedOriginal = decodeFanqieGeneralText(item.original, "search");
                } else {
                    item.decodedOriginal = decodeFanqieGeneralText(item.original, "library");
                }
            }
        });

        const itemsToTranslate = [], cachedItems = [];

        // 2. Dùng 'decodedOriginal' làm key để kiểm tra cache
        allNewItems.forEach(item => {
            if (translationCache.hasOwnProperty(item.decodedOriginal)) {
                item.translated = translationCache[item.decodedOriginal];
                cachedItems.push(item);
            } else {
                itemsToTranslate.push(item);
            }
        });

        // Phần xử lý cache không thay đổi
        if (cachedItems.length > 0) {
            console.log(`[tm-translate] Tự động dịch: Áp dụng ${cachedItems.length} mục từ cache...`);
            applyTranslationToDom(cachedItems);
        }

        // Phần dịch nội dung mới
        if (itemsToTranslate.length > 0) {
            showNotification(`Đang dịch ${itemsToTranslate.length} mục mới...`, 3000);

            const nameSet = config.nameSets[config.activeNameSet] || {};
            const nameReplacer = buildNameSetReplacer(nameSet);
            const placeholderMap = {};
            const textsToSend = [];

            itemsToTranslate.forEach(item => {
                // Không cần giải mã lại ở đây nữa vì đã làm ở trên
                item.tokens = tokenizeString(item.decodedOriginal);
                item.tokens.forEach(token => {
                    if (token.type === 'text' && token.value.trim()) {
                        const processedText = nameReplacer(token.value, placeholderMap);
                        textsToSend.push(processedText);
                    }
                });
                // Đánh dấu đang xử lý trong cache bằng key đã giải mã
                translationCache[item.decodedOriginal] = '';
            });

            const batches = splitIntoBatches(textsToSend, config.maxCharsPerRequest);
            let allTranslatedTexts = [];
            if (config.translationMode === 'local') {
                await initializeLocalTranslator();
                for (const batchArr of batches) {
                    const translatedBatch = batchArr.map(text => TranslateZhToVi.translateSentence(text));
                    allTranslatedTexts.push(...translatedBatch);
                }
            } else {
                for (const batchArr of batches) {
                    const translatedBatch = await requestServerTranslation(batchArr);
                    allTranslatedTexts.push(...(translatedBatch || []));
                }
            }

            let translationIdx = 0;
            itemsToTranslate.forEach(item => {
                const numTextTokens = item.tokens.filter(t => t.type === 'text' && t.value.trim()).length;
                const translatedParts = allTranslatedTexts.slice(translationIdx, translationIdx + numTextTokens);
                const reassembledText = reassembleTranslatedString(item.tokens, translatedParts);
                item.translated = restoreNames(reassembledText, placeholderMap);
                translationIdx += numTextTokens;

                if (item.decodedOriginal && item.translated) {
                    translationCache[item.decodedOriginal] = item.translated; // Lưu vào cache bằng key đã giải mã
                }
            });
            applyTranslationToDom(itemsToTranslate);
        }

        // Bật lại observer sau khi đã xử lý xong
        if (window.tmTranslateObserver) window.tmTranslateObserver.observe(document.body, { childList: true, subtree: true });
    }
    function startAutoTranslateObserver() {
        // Nếu observer đã tồn tại, ngắt nó đi trước khi tạo mới
        if (window.tmTranslateObserver) window.tmTranslateObserver.disconnect();
        if (!config.autoTranslateOnScroll) {
            console.log('[tm-translate] Tự động dịch đã bị tắt trong cài đặt.');
            return;
        }

        let debounceTimeout;
        const observerCallback = (mutationsList, observer) => {
            // Chỉ lấy các node element mới được thêm vào, không phải UI của script
            const addedNodes = mutationsList.flatMap(m =>
                Array.from(m.addedNodes).filter(n =>
                    n.nodeType === 1 && // Phải là element node
                    !n.closest('[id^="tm-"]') && // Không phải UI của script
                    n.textContent.trim().length > 1 // Phải có nội dung text
                )
            );

            if (addedNodes.length > 0) {
                clearTimeout(debounceTimeout);
                debounceTimeout = setTimeout(() => {
                    console.log(`[tm-translate] Phát hiện ${addedNodes.length} node mới. Bắt đầu dịch bổ sung...`);
                    // Chỉ dịch các node mới được thêm vào, không dịch lại cả trang
                    translateNewNodes(addedNodes);
                }, 500); // Debounce để tránh dịch liên tục
            }
        };

        window.tmTranslateObserver = new MutationObserver(observerCallback);
        window.tmTranslateObserver.observe(document.body, { childList: true, subtree: true });
        console.log('[tm-translate] Đã bật chế độ tự động dịch nội dung mới (chính xác hơn).');
    }

    function stopAutoTranslateObserver() {
        if (window.tmTranslateObserver) {
            window.tmTranslateObserver.disconnect();
            console.log('[tm-translate] Đã dừng chế độ tự động dịch nội dung mới.');
        }
    }
    /* ================== EDIT MODAL & HELPERS ================== */
    const yieldUI = () => new Promise(r => setTimeout(r, 0));

    function findDataOrigFromSelectionRange(range) {
        if (!range) return null;
        let container = range.commonAncestorContainer;
        if (container.nodeType === 3) container = container.parentElement;
        const span = container.closest('span[data-orig]');
        if (span) {
            return {
                orig: unescapeHtml(span.getAttribute('data-orig')),
                viet: span.textContent.trim()
            };
        }
        return null;
    }

    function showEditModal(chinese, vietnamese) {
        removeElementById('tm-edit-modal');
        const wrapper = document.createElement('div');
        wrapper.id = 'tm-edit-modal';
        wrapper.className = 'tm-modal-wrapper';
        wrapper.style.zIndex = '2147483660'; // Ensure above OCR modal (usually ~650)

        wrapper.innerHTML = `
        <div class="tm-modal-backdrop"></div>
        <div class="tm-modal-box" style="width: 500px;">
            <div class="tm-modal-header">
                <h3>Thêm / Sửa Name</h3>
                <button class="tm-btn" id="tm-edit-close">&times;</button>
            </div>
            <div class="tm-modal-content">
                <label class="tm-label">Tiếng Trung</label>
                <input id="tm-edit-orig-input" class="tm-input" value="${escapeHtml(chinese)}" />
                <label class="tm-label">Tiếng Việt</label>
                <input id="tm-edit-viet-input" class="tm-input" value="${escapeHtml(vietnamese)}" />
            </div>
            <div id="tm-edit-footer" class="tm-modal-footer" style="justify-content: space-between;">
                <button id="tm-edit-suggest-btn" class="tm-btn">Gợi ý</button>
                <div id="tm-edit-actions">
                    <!-- Các nút Thêm/Sửa/Xóa sẽ được chèn vào đây -->
                </div>
            </div>
        </div>
    `;
        document.body.appendChild(wrapper);

        const origInput = wrapper.querySelector('#tm-edit-orig-input');
        const vietInput = wrapper.querySelector('#tm-edit-viet-input');
        const actionsContainer = wrapper.querySelector('#tm-edit-actions');

        function checkNameAndRefreshUI() {
            const currentChinese = origInput.value.trim();
            const currentNameSet = config.nameSets[config.activeNameSet] || {};
            const exists = currentNameSet.hasOwnProperty(currentChinese);

            let buttonsHtml = '';
            if (exists) {
                buttonsHtml = `
                <button id="tm-edit-delete" class="tm-btn">Xóa</button>
                <button id="tm-edit-save" class="tm-btn tm-btn-primary">Sửa</button>
            `;
            } else {
                buttonsHtml = `<button id="tm-edit-add" class="tm-btn tm-btn-primary">Thêm</button>`;
            }
            actionsContainer.innerHTML = buttonsHtml;
            attachActionListeners();
        }

        function attachActionListeners() {
            const btnAdd = document.getElementById('tm-edit-add');
            const btnSave = document.getElementById('tm-edit-save');
            const btnDelete = document.getElementById('tm-edit-delete');

            const actionHandler = async (action) => {
                const setName = config.activeNameSet;
                const key = origInput.value.trim();
                const value = vietInput.value.trim();

                const oldNameSetSnapshot = JSON.parse(JSON.stringify(config.nameSets[setName] || {}));

                if (action === 'add' || action === 'save') {
                    if (!key || !value) {
                        alert('Không được để trống.');
                        return;
                    }
                    config.nameSets[setName][key] = value;
                } else if (action === 'delete') {
                    if (!confirm(`Bạn chắc chắn muốn xóa name: "${key}"?`)) return;
                    delete config.nameSets[setName][key];
                }

                saveConfig(config);
                close();

                const newNameSet = config.nameSets[setName] || {};
                await applyNameChangeLive(newNameSet, oldNameSetSnapshot);
            };

            if (btnAdd) btnAdd.onclick = () => actionHandler('add');
            if (btnSave) btnSave.onclick = () => actionHandler('save');
            if (btnDelete) btnDelete.onclick = () => actionHandler('delete');
        }

        origInput.addEventListener('input', checkNameAndRefreshUI);

        const close = () => wrapper.remove();
        wrapper.querySelector('.tm-modal-backdrop').addEventListener('click', close);
        wrapper.querySelector('#tm-edit-close').addEventListener('click', close);

        wrapper.querySelector('#tm-edit-suggest-btn').addEventListener('click', () => {
            showSuggestionModal(origInput.value, vietInput.value, (newViet) => {
                vietInput.value = newViet;
            });
        });

        checkNameAndRefreshUI();
    }

    function findChunkFromRange(range) {
        if (!range) return null;

        let node = range.startContainer;

        if (node.nodeType === 3) {
            node = node.parentElement;
        }
        if (!node) return null;

        const nameSpan = node.closest('span.tm-name');
        if (nameSpan) return nameSpan;

        const chunkSpan = node.closest('span.tm-chunk');
        if (chunkSpan) return chunkSpan;

        const ancestor = range.commonAncestorContainer;
        if (ancestor && ancestor.nodeType === 1) {
            if (ancestor.matches('span.tm-chunk')) return ancestor;
            const containedChunk = ancestor.querySelector('span.tm-chunk');
            if (containedChunk && containedChunk.textContent === range.toString()) {
                return containedChunk;
            }
        }
        return null; // Không tìm thấy
    }
    function openEditModalForSelection() {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) {
            if (lastSelectionRange && !lastSelectionRange.collapsed) {
                sel.removeAllRanges();
                sel.addRange(lastSelectionRange);
            } else {
                alert('Vui lòng bôi đen một đoạn văn bản đã dịch.');
                return;
            }
        }

        const range = sel.getRangeAt(0);
        const targetSpan = findChunkFromRange(range);

        if (targetSpan) {
            const isNameSpan = targetSpan.classList.contains('tm-name');
            const originalText = targetSpan.dataset.orig;
            const translatedText = isNameSpan ? targetSpan.textContent : targetSpan.textContent;

            console.log(`Đã tìm thấy khối dịch. Gốc: ${originalText}`);
            showEditModal(originalText, translatedText);
            return;
        }

        alert('Không tìm thấy khối dữ liệu dịch tương ứng. Hãy thử bôi đen chính xác hơn một chút.');
    }

    async function buildHanVietFromMap(chinese, map) {
        if (!map || !chinese) return '';
        return Array.from(chinese).map(c => (map[c] || c).split('/')[0]).join(' ');
    }

    function progressiveCapitalizations(s) {
        const words = s.split(/\s+/).filter(Boolean);
        if (words.length === 0) return [];
        const lines = [words.join(' ').toLowerCase()];
        for (let i = 1; i <= words.length; i++) {
            const arr = words.map((w, idx) => (idx < i ? (w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()) : w.toLowerCase()));
            lines.push(arr.join(' '));
        }
        return lines;
    }

    function showSuggestionModal(chinese, vietnamese, onSelect) {
        removeElementById('tm-suggest-modal');
        const wrapper = document.createElement('div');
        wrapper.id = 'tm-suggest-modal';
        wrapper.className = 'tm-modal-wrapper';
        wrapper.style.zIndex = '2147483665';

        wrapper.innerHTML = `
        <div class="tm-modal-backdrop"></div>
        <div class="tm-modal-box" style="width: 800px;">
            <div class="tm-modal-header">
                <h3>Gợi ý Name</h3>
                <button class="tm-btn" id="tm-suggest-close">&times;</button>
            </div>
            <div class="tm-modal-content" style="display:flex; gap: 20px;">
                <div class="tm-col" id="tm-suggest-hv-col">
                    <h4 style="margin-top:0;">Hán-Việt</h4>
                    <div class="tm-preview-box" style="height: 300px;"><p>Đang tải...</p></div>
                </div>
                <div class="tm-col">
                    <h4 style="margin-top:0;">Gợi ý từ Server</h4>
                    <div class="tm-preview-box" id="tm-suggest-current-col" style="height: 300px;"></div>
                </div>
            </div>
            <div class="tm-modal-footer">
                <button id="tm-suggest-google-search" class="tm-btn">Tìm Google</button>
                <button id="tm-suggest-google-translate" class="tm-btn">Dịch Google</button>
            </div>
        </div>
    `;
        document.body.appendChild(wrapper);

        const close = () => wrapper.remove();
        wrapper.querySelector('.tm-modal-backdrop').addEventListener('click', close);
        wrapper.querySelector('#tm-suggest-close').addEventListener('click', close);

        const currentCol = wrapper.querySelector('#tm-suggest-current-col');
        currentCol.innerHTML = "<p>Đang tải gợi ý...</p>";
        (async () => {
            try {
                let suggestionLines = [];
                if (config.translationMode === 'local') {
                    await initializeLocalTranslator();
                    const suggestions = TranslateZhToVi.suggest(chinese);
                    if (suggestions && suggestions.length > 0) {
                        const mainSuggestion = suggestions[0].val;
                        suggestionLines = progressiveCapitalizations(mainSuggestion);
                        const alts = suggestions[0].alts.filter(alt => alt !== mainSuggestion);
                        if (alts.length > 0) {
                            suggestionLines.push(...alts.map(alt => `- ${alt}`));
                        }
                    } else {
                        const translatedText = TranslateZhToVi.translateSentence(chinese);
                        suggestionLines = progressiveCapitalizations(translatedText);
                    }
                } else {
                    const translatedArray = await requestServerTranslation([chinese]);
                    const translatedText = translatedArray[0] || '';
                    if (!translatedText) throw new Error('Server đã trả về một bản dịch rỗng.');
                    suggestionLines = progressiveCapitalizations(translatedText.trim());
                }
                currentCol.innerHTML = suggestionLines.map(line => `<div class="tm-suggest-item">${escapeHtml(line)}</div>`).join('');

            } catch (error) {
                console.error("Lỗi khi lấy gợi ý:", error);
                currentCol.innerHTML = `<p style="color:red;">Lấy gợi ý thất bại.</p><p>Bản dịch hiện tại:</p>`;
                const currentLines = progressiveCapitalizations(vietnamese);
                currentCol.innerHTML += currentLines.map(line => `<div class="tm-suggest-item">${escapeHtml(line)}</div>`).join('');
            }
        })();

        // Xử lý cột Hán-Việt
        (async () => {
            const hvCol = wrapper.querySelector('#tm-suggest-hv-col .tm-preview-box');
            try {
                const hanvietData = await loadHanVietJson();
                const hanvietText = await buildHanVietFromMap(chinese, hanvietData);
                const hvLines = progressiveCapitalizations(hanvietText);
                hvCol.innerHTML = hvLines.map(line => `<div class="tm-suggest-item">${escapeHtml(line)}</div>`).join('');
            } catch (error) {
                console.error("Lỗi khi lấy Hán-Việt:", error);
                hvCol.innerHTML = "<p>Không thể tải dữ liệu Hán-Việt.</p>";
            }
        })();

        wrapper.addEventListener('click', (e) => {
            if (e.target.classList.contains('tm-suggest-item')) {
                onSelect(e.target.textContent);
                close();
            }
        });

        wrapper.querySelector('#tm-suggest-google-search').addEventListener('click', () => {
            const q = encodeURIComponent(chinese);
            if (q) GM_openInTab(`https://www.google.com/search?q=${q}`);
        });
        wrapper.querySelector('#tm-suggest-google-translate').addEventListener('click', () => {
            const q = encodeURIComponent(chinese);
            if (q) GM_openInTab(`https://translate.google.com/?sl=zh-CN&tl=vi&text=${q}&op=translate`);
        });

        GM_addStyle('.tm-suggest-item { padding: 4px 8px; cursor: pointer; border-radius: 4px; } .tm-suggest-item:hover { background-color: #e9ecef; }');
    }

    async function applyChangesAndRetranslate() {
        console.log('Cài đặt name đã thay đổi. Bắt đầu dịch lại toàn bộ trang...');
        showLoading('Đang làm mới trang với name set mới...');
        await sleep(50);

        if (originalBodyClone || originalBodyElement) {
            stopAutoTranslateObserver();
            const sourceBody = originalBodyElement || originalBodyClone;
            const restoredBody = originalBodyElement ? sourceBody : sourceBody.cloneNode(true);
            document.body.replaceWith(restoredBody);
            originalBodyElement = restoredBody;
            originalBodyClone = restoredBody.cloneNode ? restoredBody.cloneNode(true) : restoredBody;
            console.log('[tm-translate] Đã phục hồi body gốc để dịch lại.');
            lastTranslationState = null;
            translatedBodyClone = null;
            if (simplifiedActive) simplifiedActive = false;
            removeFloatingButtons();
            console.log('Bắt đầu quy trình dịch lại...');
            await startTranslateAction();
        } else {
            removeLoading();
            alert('Không tìm thấy bản sao trang gốc. Vui lòng tải lại trang (F5) để áp dụng thay đổi.');
        }
    }
    async function applyNameChangeLive(newNameSet, oldNameSet) {
        console.log('Cài đặt name đã thay đổi. Bắt đầu cập nhật thông minh (phiên bản tối ưu)...');
        showLoading('Đang cập nhật tên thông minh...');

        try {
            const allChunks = Array.from(document.querySelectorAll('.tm-chunk[data-orig]'));
            if (allChunks.length === 0) {
                console.warn("Không tìm thấy khối .tm-chunk nào, sẽ dịch lại toàn bộ trang.");
                await applyChangesAndRetranslate();
                return;
            }

            const textsToTranslate = [];
            const updatePlan = [];

            allChunks.forEach(chunk => {
                const originalChinese = chunk.dataset.orig;

                const oldNamesInChunk = Object.keys(oldNameSet).filter(name => originalChinese.includes(name));
                const newNamesInChunk = Object.keys(newNameSet).filter(name => originalChinese.includes(name));
                const deletedNames = oldNamesInChunk.filter(name => !newNamesInChunk.includes(name));
                const addedNames = newNamesInChunk.filter(name => !oldNamesInChunk.includes(name));
                const editedNames = newNamesInChunk.filter(name =>
                    oldNamesInChunk.includes(name) && newNameSet[name] !== oldNameSet[name]
                );

                if (deletedNames.length > 0 || addedNames.length > 0 || editedNames.length > 0) {
                    let textForTranslation;
                    let translationType;
                    let placeholderMapForChunk = null; // Sẽ chỉ được dùng cho THÊM/SỬA

                    if (deletedNames.length > 0) {
                        translationType = 'full_sentence';
                        textForTranslation = originalChinese;
                    } else {
                        translationType = 'placeholder';
                        placeholderMapForChunk = {};
                        let textWithPlaceholders = originalChinese;
                        newNamesInChunk.forEach((name, index) => {
                            const placeholder = `__TM_NAME_${index}__`;
                            placeholderMapForChunk[placeholder] = { orig: name, viet: newNameSet[name] };
                            textWithPlaceholders = textWithPlaceholders.replaceAll(name, placeholder);
                        });
                        textForTranslation = textWithPlaceholders;
                    }

                    const translationIndex = textsToTranslate.length;
                    textsToTranslate.push(textForTranslation);
                    updatePlan.push({
                        chunk: chunk,
                        originalChinese: originalChinese,
                        translationIndex: translationIndex,
                        translationType: translationType,
                        placeholderMap: placeholderMapForChunk
                    });
                }
            });

            if (textsToTranslate.length === 0) {
                console.log("Không có câu nào cần cập nhật. Hoàn tất.");
                removeLoading();
                return;
            }
            console.log(`Đã thu thập ${textsToTranslate.length} câu để dịch lại trong một lượt.`);

            const allTranslatedTexts = await requestServerTranslation(textsToTranslate);

            updatePlan.forEach(plan => {
                let translatedText = allTranslatedTexts[plan.translationIndex];
                if (!translatedText) return;

                if (plan.translationType === 'placeholder') {
                    translatedText = restoreNames(translatedText, plan.placeholderMap);
                } else {
                    translationCache[plan.originalChinese] = translatedText;
                }

                // Chuẩn hóa và áp dụng highlight
                const finalText = capitalizeFirstLetter(translatedText.trim());
                const finalHtml = highlightNamesInText(finalText, newNameSet);
                plan.chunk.innerHTML = finalHtml;
            });

            console.log(`[tm-translate] Đã hoàn tất cập nhật tên thông minh cho ${updatePlan.length} khối văn bản.`);

        } catch (err) {
            console.error('[tm-translate] Lỗi khi cập nhật tên thông minh, sẽ dịch lại toàn bộ trang:', err);
            await applyChangesAndRetranslate();
        } finally {
            removeLoading();
        }
    }
    /* ================== HAN-VIET & NAME HELPERS ================== */

    async function loadHanVietJson() {
        if (hanvietMap) return hanvietMap;
        const url = config.hanvietJsonUrl.trim();
        if (!url) {
            hanvietMap = {};
            return hanvietMap;
        }
        try {
            const res = await new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'GET', url,
                    onload: resolve,
                    onerror: reject,
                    ontimeout: reject,
                });
            });
            if (res.status >= 200 && res.status < 300) {
                hanvietMap = JSON.parse(res.responseText);
                return hanvietMap;
            }
            throw new Error('HTTP ' + res.status);
        } catch (e) {
            console.warn('Không thể tải file Hán-Việt JSON:', e);
            hanvietMap = {};
            return hanvietMap;
        }
    }

    /* ================== STYLE PANEL UI ================== */
    function toggleStylePanel() {
        if (document.getElementById('tm-style-panel')) {
            removeElementById('tm-style-panel');
        } else {
            createStylePanel();
        }
    }
    function removeStylePanel() { removeElementById('tm-style-panel'); }
    function createStylePanel() {
        removeStylePanel();
        const s = config.simplifiedStyle;
        const panel = document.createElement('div');
        panel.id = 'tm-style-panel';
        panel.style.position = 'fixed';
        panel.style.right = '78px';
        panel.style.bottom = '80px';
        panel.style.zIndex = '2147483641';

        panel.innerHTML = `
    <div class="tm-modal-box">
        <div class="tm-modal-header"><h3>Tùy chỉnh đọc</h3></div>
        <div class="tm-modal-content">
            <label class="tm-label">Hiển thị</label>
            <select id="tm-style-view" class="tm-select">
                <option value="translated">Văn bản dịch</option>
                <option value="original">Văn bản gốc</option>
            </select>
            <label class="tm-label">Font chữ</label>
            <select id="tm-style-font" class="tm-select">
                <option value="Noto Serif, 'Times New Roman', serif">Noto Serif (Mặc định)</option>
                <option value="Arial, 'Helvetica Neue', sans-serif">Arial</option>
                <option value="'Times New Roman', Times, serif">Times New Roman</option>
                <option value="'Segoe UI', Tahoma, sans-serif">Segoe UI</option>
            </select>
            <div class="tm-row">
                <div class="tm-col">
                    <label class="tm-label">Cỡ chữ (px)</label>
                    <input id="tm-style-size" type="number" class="tm-input" value="${s.fontSize}" />
                </div>
                <div class="tm-col">
                    <label class="tm-label">Dãn dòng</label>
                    <input id="tm-style-line" type="number" step="0.1" class="tm-input" value="${s.lineHeight}" />
                </div>
            </div>
            <label class="tm-label">Căn lề</label>
            <select id="tm-style-align" class="tm-select">
                <option value="justify">Căn đều hai bên (Justify)</option>
                <option value="left">Căn trái (Left)</option>
                <option value="center">Căn giữa (Center)</option>
            </select>
            <label class="tm-label">Màu nền & Chữ</label>
            <div style="display:flex;gap:8px;margin:8px 0;">
                <div class="tm-bg-swatch" data-bg="#fdfdf6" data-text="#1f1f1f" style="background:#fdfdf6" title="Mặc định"></div>
                <div class="tm-bg-swatch" data-bg="#ffffff" data-text="#111111" style="background:#ffffff" title="Trắng"></div>
                <div class="tm-bg-swatch" data-bg="#eaf3ea" data-text="#222822" style="background:#eaf3ea" title="Xanh lá nhạt"></div>
                <div class="tm-bg-swatch" data-bg="#292a2d" data-text="#e8e6e3" style="background:#292a2d" title="Tối"></div>
            </div>
        </div>
        <div class="tm-modal-footer">
            <button id="tm-style-reset" class="tm-btn">Mặc định</button>
            <button id="tm-style-apply" class="tm-btn tm-btn-primary">Áp dụng</button>
        </div>
    </div>`;

        document.body.appendChild(panel);

        // Set initial values
        panel.querySelector('#tm-style-view').value = config.simplifiedShowOriginal ? 'original' : 'translated';
        panel.querySelector('#tm-style-font').value = s.fontFamily;
        panel.querySelector('#tm-style-align').value = s.textAlign;
        const swatches = panel.querySelectorAll('.tm-bg-swatch');
        swatches.forEach(sw => {
            if (sw.dataset.bg === s.bgColor) sw.classList.add('active');
            sw.addEventListener('click', () => {
                swatches.forEach(x => x.classList.remove('active'));
                sw.classList.add('active');
            });
        });

        panel.querySelector('#tm-style-apply').addEventListener('click', () => {
            const activeSwatch = panel.querySelector('.tm-bg-swatch.active') || swatches[0];
            config.simplifiedStyle = {
                fontFamily: panel.querySelector('#tm-style-font').value,
                fontSize: parseInt(panel.querySelector('#tm-style-size').value, 10) || 21,
                lineHeight: parseFloat(panel.querySelector('#tm-style-line').value) || 1.9,
                textAlign: panel.querySelector('#tm-style-align').value,
                bgColor: activeSwatch.dataset.bg,
                textColor: activeSwatch.dataset.text
            };
            config.simplifiedShowOriginal = panel.querySelector('#tm-style-view').value === 'original';
            saveConfig(config);
            if (simplifiedActive) {
                const newContent = buildSimplifiedHtml(lastTranslationState.items);
                const contentDiv = document.getElementById('tm-simplified-content');
                if (contentDiv) {
                    contentDiv.innerHTML = newContent;
                }
                applySimplifiedStyle();
            }
            removeStylePanel();
        });

        panel.querySelector('#tm-style-reset').addEventListener('click', () => {
            config.simplifiedStyle = { ...DEFAULT_CONFIG.simplifiedStyle };
            saveConfig(config);
            if (simplifiedActive) applySimplifiedStyle();
            removeStylePanel();
        });
    }

    /* ================== FULL SETTINGS UI ================== */
    function showQuickTranslatePanel() {
        removeElementById('tm-quick-translate-panel');
        const wrapper = document.createElement('div');
        wrapper.id = 'tm-quick-translate-panel';
        wrapper.className = 'tm-modal-wrapper';
        wrapper.style.zIndex = '2147483644';

        wrapper.innerHTML = `
    <div class="tm-modal-backdrop"></div>
    <div class="tm-modal-box"
         style="width: 95vw; max-width: 1400px; height: 90vh;
                display: flex; flex-direction: column;">
        <div class="tm-modal-header">
            <h3>Bảng dịch nhanh</h3>
            <button class="tm-btn" id="tm-quick-close">&times;</button>
        </div>

        <div class="tm-modal-content"
             style="display: flex; gap: 20px; padding: 20px;
                    flex: 1; min-height: 0;">

            <!-- Cột Tiếng Trung -->
            <div class="tm-col"
                 style="display: flex; flex-direction: column;
                        flex: 1; min-width: 0; height: 100%;">
                <label class="tm-label" style="flex-shrink: 0;">
                    Nhập văn bản (Tiếng Trung):
                </label>
                <textarea id="tm-quick-input" class="tm-textarea"
                    style="flex: 1; resize: none; margin: 0;
                           font-family: monospace; padding: 10px;
                           width: 100%; box-sizing: border-box;
                           overflow-y: auto; scrollbar-gutter: stable;"></textarea>
            </div>

            <!-- Cột Tiếng Việt -->
            <div class="tm-col"
                 style="display: flex; flex-direction: column;
                        flex: 1; min-width: 0; height: 100%;">
                <label class="tm-label" style="flex-shrink: 0;">
                    Kết quả (Tiếng Việt):
                </label>
                <div id="tm-quick-output" class="tm-preview-box"
                     style="flex: 1; height: 100%; max-height: none;
                            margin: 0; background: var(--tm-white);
                            padding: 10px; font-size: 16px; line-height: 1.7;
                            overflow-y: auto; scrollbar-gutter: stable;
                            width: 100%; box-sizing: border-box;
                            border: 1px solid var(--tm-border-color);
                            border-radius: 6px;">
                    <p style="color: #888; margin: 0;">
                        Nhập văn bản bên trái và nhấn "Dịch"...
                    </p>
                </div>
            </div>
        </div>

        <div class="tm-modal-footer"
             style="display: flex; justify-content: flex-end;
                    align-items: center; gap: 10px; flex-shrink: 0;">
            <button id="tm-quick-edit-mode-btn" class="tm-btn"
                    style="margin-right: auto; color: rgb(0, 123, 255);
                           border-color: rgb(0, 123, 255); display: none;">
                🖊 Sửa tên
            </button>
            <button id="tm-quick-translate-action"
                    class="tm-btn tm-btn-primary">
                Dịch ngay
            </button>
        </div>
    </div>
`;


        document.body.appendChild(wrapper);

        const close = () => wrapper.remove();
        wrapper.querySelector('#tm-quick-close').addEventListener('click', close);

        const inputArea = wrapper.querySelector('#tm-quick-input');
        const outputArea = wrapper.querySelector('#tm-quick-output');
        const translateBtn = wrapper.querySelector('#tm-quick-translate-action');
        const editBtn = wrapper.querySelector('#tm-quick-edit-mode-btn');

        // Ẩn nút edit mặc định
        editBtn.style.display = 'none';

        editBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openEditModalForSelection();
        });

        translateBtn.addEventListener('click', async () => {
            const text = inputArea.value.trim();
            if (!text) return;

            translateBtn.disabled = true;
            translateBtn.textContent = 'Đang dịch...';
            outputArea.innerHTML = '<p style="color: #666;">⏳ Đang xử lý...</p>';

            editBtn.style.display = 'none';

            try {
                const htmlResult = await translatePanelText(text);
                outputArea.innerHTML = htmlResult;

                if (config.nameEditingEnabled) {
                    editBtn.style.display = 'block';
                }

            } catch (err) {
                console.error("Lỗi dịch nhanh:", err);
                outputArea.innerHTML = `<p style="color:red;">Lỗi: ${err.message}</p>`;
            } finally {
                translateBtn.disabled = false;
                translateBtn.textContent = 'Dịch ngay';
            }
        });
    }
    // --- Global Local Dict Logic (Refactored for OCR Access) ---
    var localDictState = {
        currentPage: 1,
        itemsPerPage: 100,
        filter: '',
        dictKey: 'nameRaw',
        filteredKeys: []
    };

    function buildBucketsFromDict(dictObj) {
        const buckets = Object.create(null);
        let maxLen = 0;
        for (const k of Object.keys(dictObj)) {
            const len = k.length; if (len === 0) continue;
            if (!buckets[len]) buckets[len] = Object.create(null);
            buckets[len][k] = dictObj[k];
            if (len > maxLen) maxLen = len;
        }
        return { buckets, maxLen };
    }

    async function saveLocalDictChanges(dictKeyToUpdate) {
        try {
            const dictData = window.TranslateZhToVi._raw[dictKeyToUpdate];
            if (dictKeyToUpdate === 'nameRaw') {
                window.TranslateZhToVi._idx.nameIdx = buildBucketsFromDict(dictData);
            } else if (dictKeyToUpdate === 'vpRaw') {
                window.TranslateZhToVi._idx.vpIdx = buildBucketsFromDict(dictData);
            } else if (dictKeyToUpdate === 'hvRaw') {
                window.TranslateZhToVi._idx.hvDict = dictData;
            }

            // Trigger save
            const DUMMY_KEY = '__TM_TRANSLATE_TRIGGER_SAVE__';
            window.TranslateZhToVi.addEntry('name', DUMMY_KEY, '');
            delete window.TranslateZhToVi._raw.nameRaw[DUMMY_KEY];
            window.TranslateZhToVi.addEntry('name', DUMMY_KEY, '');
            delete window.TranslateZhToVi._raw.nameRaw[DUMMY_KEY];
            console.log(`Từ điển ${dictKeyToUpdate} đã được lưu vào cache.`);
            return true;
        } catch (e) {
            alert('Lưu từ điển vào cache thất bại. Lỗi: ' + e.message);
            return false;
        }
    }

    function renderLocalDictPage() {
        const localDictResults = document.getElementById('tm-local-dict-results');
        const pageInfo = document.getElementById('tm-local-page-info');
        const prevBtn = document.getElementById('tm-local-prev-btn');
        const nextBtn = document.getElementById('tm-local-next-btn');

        if (!localDictResults || !pageInfo) return; // UI not open

        const dictData = window.TranslateZhToVi._raw[localDictState.dictKey];
        if (!dictData) {
            localDictResults.innerHTML = `<p style="color: #888; padding: 10px;">Không có dữ liệu cho từ điển này.</p>`;
            return;
        }

        // Search/Filter Logic
        if (localDictState.filter) {
            const filterLower = localDictState.filter.toLowerCase();
            localDictState.filteredKeys = Object.keys(dictData).filter(k => k.toLowerCase().includes(filterLower));
        } else {
            localDictState.filteredKeys = Object.keys(dictData);
        }

        const totalItems = localDictState.filteredKeys.length;
        const totalPages = Math.ceil(totalItems / localDictState.itemsPerPage) || 1;
        localDictState.currentPage = Math.max(1, Math.min(localDictState.currentPage, totalPages));

        const start = (localDictState.currentPage - 1) * localDictState.itemsPerPage;
        const end = start + localDictState.itemsPerPage;
        const pageKeys = localDictState.filteredKeys.slice(start, end);

        let html = '';
        if (pageKeys.length === 0) {
            html = `<p style="color: #888; padding: 10px;">Không tìm thấy kết quả nào.</p>`;
        } else {
            pageKeys.forEach(key => {
                const valueObj = dictData[key];
                const valueStr = (typeof valueObj === 'object' && valueObj.val !== undefined) ? valueObj.val : String(valueObj);
                html += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 5px; border-bottom: 1px solid #f0f0f0;">
                    <div style="flex-grow: 1; user-select: text;">
                        <strong>${escapeHtml(key)}</strong> → <em>${escapeHtml(valueStr)}</em>
                    </div>
                    <div style="flex-shrink: 0;">
                        <button class="tm-btn" data-action="edit" data-key="${escapeHtml(key)}" style="padding: 2px 8px; margin-right: 5px;">Sửa</button>
                        <button class="tm-btn" data-action="delete" data-key="${escapeHtml(key)}" style="padding: 2px 8px;">Xóa</button>
                    </div>
                </div>`;
            });
        }
        localDictResults.innerHTML = html;

        pageInfo.textContent = `Trang ${localDictState.currentPage} / ${totalPages} (${totalItems} mục)`;
        if (prevBtn) prevBtn.disabled = localDictState.currentPage === 1;
        if (nextBtn) nextBtn.disabled = localDictState.currentPage === totalPages;
    }

    function showLocalDictEntryModal(key = '', value = '') {
        const isAdding = !key;
        const modalId = 'tm-local-entry-modal';
        removeElementById(modalId);

        const modalHtml = `
        <div id="${modalId}" class="tm-modal-wrapper" style="z-index: 2147483648;">
            <div class="tm-modal-backdrop"></div>
            <div class="tm-modal-box" style="width: 450px;">
                <div class="tm-modal-header"><h3>${isAdding ? 'Thêm mục mới' : 'Sửa mục'}</h3></div>
                <div class="tm-modal-content">
                    <label class="tm-label">Tiếng Trung</label>
                    <input id="tm-local-key" class="tm-input" value="${escapeHtml(key)}" ${isAdding ? '' : 'disabled'}>
                    <label class="tm-label">Tiếng Việt (các nghĩa cách nhau bằng /)</label>
                    <input id="tm-local-value" class="tm-input" value="${escapeHtml(value)}">
                </div>
                <div class="tm-modal-footer">
                    <button id="tm-local-cancel" class="tm-btn">Hủy</button>
                    <button id="tm-local-save" class="tm-btn tm-btn-primary">Lưu</button>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const modal = document.getElementById(modalId);
        const valueInput = modal.querySelector('#tm-local-value');
        const keyInput = modal.querySelector('#tm-local-key');

        // Focus logic
        setTimeout(() => {
            if (isAdding && keyInput) keyInput.focus();
            else if (valueInput) valueInput.focus();
        }, 50);

        const close = () => modal.remove();
        modal.querySelector('.tm-modal-backdrop').addEventListener('click', close);
        modal.querySelector('#tm-local-cancel').addEventListener('click', close);

        modal.querySelector('#tm-local-save').addEventListener('click', async () => {
            const currentDictKey = localDictState.dictKey || 'nameRaw';

            const newKey = modal.querySelector('#tm-local-key').value.trim();
            const newValueRaw = valueInput.value;

            if (!newKey) {
                alert('Tiếng Trung không được để trống.');
                return;
            }

            const parts = newValueRaw.split('/').map(x => x.trim());
            const val = parts[0] || '';
            const alts = parts.length > 0 ? parts : [val];
            const newEntry = { val, alts };
            if (val === '') newEntry.skip = true;

            if (!window.TranslateZhToVi._raw[currentDictKey]) {
                window.TranslateZhToVi._raw[currentDictKey] = {};
            }

            window.TranslateZhToVi._raw[currentDictKey][newKey] = newEntry;

            if (await saveLocalDictChanges(currentDictKey)) {
                close();
                renderLocalDictPage();
            }
        });
    }

    // --- Helper Kiểm tra Blacklist ---
    function checkBlacklistStatus() {
        const cfg = loadConfig();
        const h = window.location.hostname;
        return cfg.blacklist && cfg.blacklist.some(domain => h.includes(domain));
    }
    function openSettingsUI() {
        removeElementById('tm-settings-modal');
        config = loadConfig();
        ensureServerEndpointStore();
        const oldNameSetSnapshot = JSON.parse(JSON.stringify(config.nameSets[config.activeNameSet] || {}));

        const configSnapshot = JSON.stringify(config);
        let isSaving = false;

        const currentProvider = config.serverProvider || 'dichngay';
        const serverEndpointsForUi = config.serverEndpoints || {};
        const currentServerUrl = escapeHtml(serverEndpointsForUi[currentProvider] || SERVER_PROVIDER_DEFAULTS[currentProvider] || SERVER_PROVIDER_DEFAULTS.dichngay);

        const wrapper = document.createElement('div');
        wrapper.id = 'tm-settings-modal';
        wrapper.className = 'tm-modal-wrapper';

        const isBlocked = checkBlacklistStatus();
        const hiddenStyle = isBlocked ? 'display: none !important;' : '';
        const activeClass = (tab) => (isBlocked && tab === 'blacklist') || (!isBlocked && tab === 'namesets') ? 'active' : '';

        wrapper.innerHTML = `
    <div class="tm-modal-backdrop"></div>
    <div class="tm-modal-box" style="width: 980px;">
        <div class="tm-modal-header">
            <h2>${isBlocked ? '🚫 Quản lý Chặn (Blacklist)' : 'Cài đặt - TM Translate'}</h2>
            <button id="tm-settings-close" class="tm-btn">&times;</button>
        </div>
        <div class="tm-tabs-nav">
            <button class="tm-tab-btn ${activeClass('namesets')}" data-tab="namesets" style="${hiddenStyle}">Bộ Tên</button>
            <button class="tm-tab-btn ${activeClass('general')}" data-tab="general" style="${hiddenStyle}">Chung</button>
            <button class="tm-tab-btn ${activeClass('ocr')}" data-tab="ocr" style="${hiddenStyle}">OCR</button>
            <button class="tm-tab-btn ${activeClass('advanced')}" data-tab="advanced" style="${hiddenStyle}">Nâng cao</button>
            <button class="tm-tab-btn ${activeClass('blacklist')}" data-tab="blacklist">Blacklist</button>
            <button class="tm-tab-btn ${activeClass('localedit')}" data-tab="localedit" style="${hiddenStyle}">Từ điển Local</button>
        </div>
        <div class="tm-modal-content">
            <!-- Name Sets Tab -->
            <div id="tab-namesets" class="tm-tab-content active">
                <div class="tm-row">
                    <div class="tm-col">
                        <label class="tm-label">Bộ tên đang hoạt động</label>
                        <div class="tm-row" style="align-items: center;">
                            <div class="tm-col"><select id="tm-sets" class="tm-select" style="margin-bottom: 0;"></select></div>
                            <button id="tm-newset" class="tm-btn">Tạo bộ mới</button>
                            <button id="tm-delset" class="tm-btn">Xóa bộ này</button>
                        </div>
                        <div class="tm-row" style="align-items: center;">
                            <label class="tm-label" style="margin: 0;">Công cụ:</label>
                            <button id="tm-import-btn" class="tm-btn">Nhập từ File</button>
                            <button id="tm-export-json-btn" class="tm-btn">Xuất ra JSON</button>
                            <button id="tm-export-txt-btn" class="tm-btn">Xuất ra TXT</button>
                            <button id="tm-clearset" class="tm-btn">Xóa tất cả name</button>
                             <input type="file" id="tm-import-file" style="display: none;" accept=".json,.txt">
                        </div>
                        <label class="tm-label" style="margin-top: 16px;">Thêm/Sửa nhanh (mỗi dòng: Trung=Việt)</label>
                        <textarea id="tm-pairs" class="tm-textarea" style="height: 250px; font-family: monospace;" placeholder="Ví dụ:\n贺川=Hạ Xuyên\n崔然=Thôi Nhiên"></textarea>
                        <button id="tm-save-pairs" class="tm-btn tm-btn-primary">Thêm/Cập nhật các cặp này</button>
                    </div>
                    <div class="tm-col" style="flex: 0 0 400px;">
                        <label class="tm-label">Các tên trong bộ "<span id="tm-current-set-name"></span>"</label>
                        <div id="tm-preview" class="tm-preview-box"></div>
                    </div>
                </div>
            </div>
            <!-- General Tab -->
            <div id="tab-general" class="tm-tab-content">
                <label class="tm-label">Chế độ dịch</label>
                <select id="tm-translation-mode" class="tm-select">
                     <option value="server">Server</option>
                     <option value="local">Local (nhanh, offline, cần tải từ điển)</option>
                </select>
                <p style="font-size:13px; color:#555">Chế độ Local dùng thư viện tích hợp sẵn, dịch nhanh và không cần server. Yêu cầu tải bộ từ điển lần đầu.</p>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
                <label class="tm-label">
                     <input type="checkbox" id="tm-name-editing-enabled" style="margin-right: 5px;" />
                     Bật chế độ Sửa Tên (Edit Name)
                </label>
                <div id="tm-allow-copy-container" style="padding-left: 25px; margin-top: 8px;">
                     <label class="tm-label" style="font-weight: normal;">
                         <input type="checkbox" id="tm-allow-copy-checkbox" style="margin-right: 5px;" />
                         Cho phép copy văn bản khi đang ở chế độ Sửa Tên
                     </label>
                </div>
                <p style="font-size:13px; color:#c0392b; background: #f9e3e3; padding: 5px; border-radius: 4px;">
                    <b>Cảnh báo:</b> Tính năng này cần bọc văn bản đã dịch trong thẻ <code>&lt;span&gt;</code>.
                    Điều này có thể làm một số trang web bị lỗi hiển thị hoặc hoạt động không đúng.
                    <b>Tắt tính năng này để có độ tương thích cao nhất. Nên bật khi rút gọn trang.</b>
                </p>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
                <label class="tm-label">
                     <input type="checkbox" id="tm-show-start-btn" style="margin-right: 5px;" />
                     Hiển thị nút "Dịch" nổi trên trang
                </label>
                <p style="font-size:13px; color:#555">Bật/tắt nút dịch màu xanh lá cây ở góc màn hình.</p>
                <label class="tm-label" style="margin-top: 16px;">
                     <input type="checkbox" id="tm-show-quick-btn" style="margin-right: 5px;" />
                     Hiển thị nút "Bảng dịch nhanh"
                </label>
                <p style="font-size:13px; color:#555">Hiển thị nút dịch nhanh (hình hộp thoại) để dịch văn bản bất kỳ.</p>
                <label class="tm-label" style="margin-top: 16px;">
                     <input type="checkbox" id="tm-show-restore-btn" style="margin-right: 5px;" />
                     Hiển thị nút "Quay về" trên trang
                </label>
                <p style="font-size:13px; color:#555">Hiển thị nút quay về để trở về trang gốc mà không cần reload trang. (Không hoạt động với Chế độ đọc rút gọn)</p>
                <label class="tm-label" style="margin-top: 16px;">
                     <input type="checkbox" id="tm-auto-translate-scroll" style="margin-right: 5px;" />
                     Tự động dịch khi có nội dung mới
                </label>
                <p style="font-size:13px; color:#555">Khi cuộn trang hoặc có nội dung mới hiện ra, script sẽ tự dịch. Tắt đi nếu bạn muốn tự kiểm soát.</p>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
                <label class="tm-label">Chế độ đọc rút gọn (Simplified View)</label>
                <select id="tm-simplified" class="tm-select">
                     <option value="0">Tắt</option>
                     <option value="1">Bật (sẽ kích hoạt sau khi dịch)</option>
                </select>
                <p style="font-size:13px; color:#555">Chế độ này sẽ hiển thị nội dung đã dịch trên một trang sạch, dễ đọc, loại bỏ các thành phần không cần thiết của trang web gốc.</p>

                <label class="tm-label" style="margin-top: 16px;">
                     <input type="checkbox" id="tm-simplified-js" style="margin-right: 5px;" />
                     Chặn JavaScript trong chế độ rút gọn
                </label>
                <p style="font-size:13px; color:#555">Ngăn các script của trang gốc chạy, giúp trang nhẹ hơn và tránh các popup/quảng cáo khó chịu. Khuyên dùng.</p>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">

                <label class="tm-label" style="margin-top: 16px;">
                     <input type="checkbox" id="tm-override-font-enabled" style="margin-right: 5px;" />
                     Ghi đè font chữ sau khi dịch (chế độ thường)
                </label>
                <p style="font-size:13px; color:#555">Tự động đổi font của trang sang một font dễ đọc hơn cho tiếng Việt.</p>
                <label class="tm-label">Font chữ thay thế</label>
                <select id="tm-override-font-family" class="tm-select">
                    <option value="Noto Serif, 'Times New Roman', serif">Noto Serif (Mặc định)</option>
                    <option value="Arial, 'Helvetica Neue', sans-serif">Arial</option>
                    <option value="'Times New Roman', Times, serif">Times New Roman</option>
                    <option value="Verdana, Geneva, sans-serif">Verdana</option>
                    <option value="'Segoe UI', Tahoma, sans-serif">Segoe UI</option>
                </select>
            </div>
            <!-- OCR Tab -->
            <div id="tab-ocr" class="tm-tab-content">
                <label class="tm-label">Extension Hỗ Trợ (Khuyên dùng)</label>
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                    <div id="tm-ext-status-indicator" style="padding: 6px 12px; border-radius: 4px; background: #eee; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                        <span id="tm-ext-status-icon">❓</span>
                        <span id="tm-ext-status-text">Đang kiểm tra Extension...</span>
                    </div>
                    <button id="tm-ext-check-btn" class="tm-btn" title="Kiểm tra lại" style="width: 34px; height: 34px; padding: 0; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                        🔄
                    </button>
                </div>

                <details style="background: #f8f9fa; border: 1px solid #eee; border-radius: 6px; padding: 10px; margin-bottom: 20px;">
                    <summary style="cursor: pointer; font-weight: 500; color: #007bff;">Hướng dẫn cài đặt Extension Helper</summary>
                    <div style="margin-top: 10px; font-size: 13px; line-height: 1.6; color: #333;">
                        <p>Extension giúp tăng tốc độ OCR, tránh lỗi CORS và giảm tải cho trình duyệt.</p>
                        <ol style="padding-left: 20px; margin: 0;">
                            <li>1. Tải file zip tại đây: <a href="https://drive.usercontent.google.com/u/0/uc?id=1c2ZdFYdBTUawSfwr1fOsGluwmSq1Ctgg&export=download" target="_blank" style="color: #007bff; text-decoration: underline;">Download</a></li>
                            <li>2. Giải nén file vừa tải (Extract Here).</li>
                            <li>3. Mở trình duyệt, truy cập vào <a href="chrome://extensions" target="_blank" style="color: #007bff; text-decoration: underline;">chrome://extensions</a> (hoặc <a href="edge://extensions" target="_blank" style="color: #007bff; text-decoration: underline;">edge://extensions</a>).</li>
                            <li>4. Bật chế độ <b>Developer Mode</b> (Chế độ nhà phát triển) ở góc trên bên phải.</li>
                            <li>5. Nhấn nút <b>Load Unpacked</b> (Tải tiện ích đã giải nén).</li>
                            <li>6. Chọn thư mục <b>TM-Extension-Helper</b> vừa giải nén.</li>
                            <li>7. Quay lại đây, tải lại trang và vào Cài đặt tab <b>OCR</b> nhấn nút 🔄 để kiểm tra.</li>
                        </ol>
                    </div>
                </details>

                <label class="tm-label">
                     <input type="checkbox" id="tm-show-ocr-btn" style="margin-right: 5px;" />
                     Hiển thị nút "OCR" trên trang
                </label>
                <p style="font-size:13px; color:#555">Hiển thị nút OCR nổi (hình máy ảnh/vùng chọn) để dịch vùng chọn nhanh chóng.</p>

                <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">

                <label class="tm-label">Font chữ OCR (Overlay)</label>
                <select id="tm-ocr-font" class="tm-select">
                    <option value="Noto Serif" style="font-family: 'Noto Serif', serif;">Noto Serif (Mặc định)</option>
                    <option value="Arial" style="font-family: Arial, sans-serif;">Arial</option>
                    <option value="Times New Roman" style="font-family: 'Times New Roman', serif;">Times New Roman</option>
                    <option value="Verdana" style="font-family: Verdana, sans-serif;">Verdana</option>
                    <option value="Segoe UI" style="font-family: 'Segoe UI', sans-serif;">Segoe UI</option>
                </select>
                <p style="font-size:13px; color:#555">Chọn font chữ khi hiển thị kết quả dịch ở chế độ Overlay.</p>

                <label class="tm-label" style="margin-top: 15px;">Chế độ d/động (Action Mode)</label>
                <select id="tm-ocr-action-mode" class="tm-select">
                    <option value="region">Khoanh vùng (Crop)</option>
                    <option value="image">Dịch ảnh (Image Trans)</option>
                </select>

                <div id="tm-ocr-source-group" style="display:none; margin-top: 10px; padding-left: 10px; border-left: 2px solid #ddd;">
                    <label class="tm-label">Nguồn dữ liệu (Source)</label>
                    <select id="tm-ocr-image-source" class="tm-select">
                        <option value="screen">Toàn màn hình (Screen)</option>
                        <option value="import">Nhập ảnh (Import File/URL)</option>
                    </select>
                </div>

                <label class="tm-label" style="margin-top: 15px;">Kiểu hiển thị kết quả (Display)</label>
                <select id="tm-ocr-mode" class="tm-select">
                     <option value="overlay">Hiển thị đè lên ảnh (Overlay)</option>
                     <option value="popup">Hiển thị dạng Popup (Split View)</option>
                </select>

                <label class="tm-label">Hệ số thu nhỏ chữ (Scale Factor)</label>
                <input id="tm-ocr-scale" type="number" step="0.1" min="0.5" max="5.0" class="tm-input" value="${config.ocrTextScaleFactor || 1.8}">
                <p style="font-size:13px; color:#555">Giá trị càng lớn, chữ càng nhỏ. Nên chỉnh <strong>1.5 - 2.0</strong> cho tiếng Việt.</p>

                <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">

                <label class="tm-label">Trạng thái Model OCR</label>
                <div id="tm-ocr-status" style="background: #f9f9f9; padding: 10px; border-radius: 4px; border: 1px solid #eee; font-size: 13px; font-family: monospace;">
                    Local Model: Đang kiểm tra...
                </div>
                <button id="tm-ocr-clear-cache" class="tm-btn" style="margin-top: 10px; background-color: #fbecec; border-color: #e57373;">Xóa Cache Model & WASM</button>

                <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">

                <label class="tm-label">Cài đặt thủ công (Offline)</label>
                <p style="font-size:12px; color:#555; margin-bottom:8px;">Nếu tải tự động lỗi, hãy tải file <a href="https://github.com/xushengfeng/eSearch-OCR/releases/download/4.0.0/ch.zip" target="_blank" style="color:#007bff">ch.zip tại đây</a> (hoặc release Github bất kỳ chứa ppocr_*.onnx), sau đó chọn file để cài.</p>
                <input type="file" id="tm-ocr-import-input" accept=".zip" style="display:none">
                <button id="tm-ocr-import-btn" class="tm-btn" style="background-color: #e2e6ea; width:100%">📂 Chọn file Zip Model để cài...</button>
            </div>
            <!-- Advanced Tab -->
            <div id="tab-advanced" class="tm-tab-content">
                <label class="tm-label">Nguồn server dịch</label>
                <select id="tm-server-provider" class="tm-select">
                    <option value="dichngay">dichngay.com (mặc định)</option>
                    <option value="dichnhanh">dichnhanh.com (beta)</option>
                </select>
                <p style="font-size:13px; color:#555">Chọn nguồn dịch phù hợp. Nếu chọn dichnhanh.com, các tham số sẽ được gửi theo chuẩn cố định của API này.</p>
                <label class="tm-label">URL Server Dịch</label>
                <input id="tm-server" class="tm-input" value="${currentServerUrl}" />
                <div id="tm-dichnhanh-options" class="tm-advanced-subsection" style="margin-top: 16px; padding: 12px; border: 1px solid #eee; border-radius: 8px; background: #fcfcfc;">
                    <h4 style="margin-top:0;">Tùy chọn riêng cho dichnhanh.com</h4>
                    <div class="tm-row">
                        <div class="tm-col">
                            <label class="tm-label">Chế độ dịch</label>
                            <select id="tm-dichnhanh-mode" class="tm-select">
                                <option value="vi">vi (Tiếng Việt)</option>
                                <option value="qt">qt (QT)</option>
                                <option value="hv">hv (Hán Việt)</option>
                            </select>
                        </div>
                        <div class="tm-col">
                            <label class="tm-label">Văn phong</label>
                            <select id="tm-dichnhanh-type" class="tm-select">
                                <option value="Ancient">Cổ đại</option>
                                <option value="Modern">Hiện đại</option>
                            </select>
                        </div>
                    </div>
                    <p style="font-size:12px; color:#c0392b; margin-top:-8px; margin-bottom:12px;">
                        * Chế độ QT hiện chưa được tích hợp. Vui lòng không chọn!
                    </p>
                    <label class="tm-label" style="display:flex; align-items:center; gap:8px;">
                        <input type="checkbox" id="tm-dichnhanh-analyze" />
                        Phân tích tên (enable_analyze)
                    </label>
                    <p style="font-size:12px; color:#c0392b; margin-top:-8px; margin-bottom:12px;">
                        * Bật phân tích giúp bắt tên chính xác hơn nhưng sẽ tăng thời gian phản hồi đáng kể.
                    </p>
                    <label class="tm-label" style="display:flex; align-items:center; gap:8px;">
                        <input type="checkbox" id="tm-dichnhanh-fanfic" />
                        Bật name fanfic (enable_fanfic)
                    </label>
                </div>
                <label class="tm-label">URL file Hán-Việt JSON</label>
                <input id="tm-hv-url" class="tm-input" value="${escapeHtml(config.hanvietJsonUrl || '')}" />
                <div class="tm-row">
                    <div class="tm-col"><label class="tm-label">Delay giữa các request (ms)</label><input id="tm-delay" type="number" class="tm-input" value="${config.delayMs}" /></div>
                    <div class="tm-col"><label class="tm-label">Số ký tự tối đa / request</label><input id="tm-max" type="number" class="tm-input" value="${config.maxCharsPerRequest}" /></div>
                </div>
            </div>
            <div id="tab-blacklist" class="tm-tab-content ${activeClass('blacklist')}">
                <p style="font-size:13px; color:#555">
                    Các trang web trong danh sách này sẽ <b>không hiển thị nút dịch</b> và <b>không tự động dịch</b>.
                    <br>Bạn vẫn có thể vào Cài đặt từ menu Tampermonkey.
                </p>
                <div class="tm-row" style="margin-bottom: 12px;">
                    <div class="tm-col">
                         <input id="tm-blacklist-input" class="tm-input" placeholder="Nhập tên miền (vd: google.com)" style="margin-bottom:0;" />
                    </div>
                    <button id="tm-blacklist-add" class="tm-btn tm-btn-primary">Thêm</button>
                    <button id="tm-blacklist-block-current" class="tm-btn" style="background:#e74c3c; color:white; border-color:#c0392b;">Chặn trang này</button>
                </div>
                <div id="tm-blacklist-container" class="tm-preview-box" style="height: 250px;">
                    </div>
            </div>
            <div id="tab-localedit" class="tm-tab-content">
                <p style="font-size:13px; color:#555">
                    Tìm kiếm, chỉnh sửa hoặc xóa các mục trong từ điển Local.
                    <br><b>Lưu ý:</b> Thay đổi sẽ được lưu vào cache và có hiệu lực ngay.
                </p>
                <!-- Hàng điều khiển -->
                <div class="tm-row" style="align-items: center; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                    <div class="tm-col" style="flex-grow: 1;">
                        <label class="tm-label" style="margin-bottom: 0;">Chọn từ điển:</label>
                        <select id="tm-local-dict-select" class="tm-select" style="margin-top: 4px; margin-bottom: 0;">
                            <option value="nameRaw">Name.json</option>
                            <option value="vpRaw">VP.json</option>
                            <option value="hvRaw">HanViet.json</option>
                        </select>
                    </div>
                    <div class="tm-col" style="flex-grow: 2;">
                        <label class="tm-label" style="margin-bottom: 0;">Tìm kiếm (Tiếng Trung):</label>
                        <input id="tm-local-dict-search" type="text" class="tm-input" placeholder="Nhập từ cần tìm..." style="margin-top: 4px; margin-bottom: 0;">
                    </div>
                    <div class="tm-col" style="flex-shrink: 0; align-self: flex-end;">
                         <button id="tm-local-dict-add" class="tm-btn tm-btn-primary">Thêm mục mới</button>
                    </div>
                </div>
                <!-- Khu vực hiển thị kết quả -->
                <div id="tm-local-dict-results" class="tm-preview-box" style="height: 320px; font-size: 13px;">
                    <!-- Kết quả sẽ được chèn vào đây -->
                </div>
                <!-- Hàng phân trang -->
                <div id="tm-local-dict-pagination" style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                    <button id="tm-local-prev-btn" class="tm-btn">&lt; Trang trước</button>
                    <span id="tm-local-page-info">Trang 1 / 1</span>
                    <button id="tm-local-next-btn" class="tm-btn">Trang sau &gt;</button>
                </div>
                <hr style="margin: 15px 0;">
                <button id="tm-local-dict-restore" class="tm-btn" style="background-color: #fbecec; border-color: #e57373;">Khôi phục từ điển gốc (Xóa Cache)</button>
            </div>
        </div>
        <div class="tm-modal-footer">
            <button id="tm-settings-save" class="tm-btn tm-btn-primary">Lưu & Đóng</button>
            <button id="tm-settings-cancel" class="tm-btn">Hủy</button>
        </div>
    </div>`;

        const serverProviderSelect = wrapper.querySelector('#tm-server-provider');
        const serverUrlInput = wrapper.querySelector('#tm-server');
        const dnOptionsWrapper = wrapper.querySelector('#tm-dichnhanh-options');
        const dnModeSelect = wrapper.querySelector('#tm-dichnhanh-mode');
        const dnTypeSelect = wrapper.querySelector('#tm-dichnhanh-type');
        const dnAnalyzeCheckbox = wrapper.querySelector('#tm-dichnhanh-analyze');
        const dnFanficCheckbox = wrapper.querySelector('#tm-dichnhanh-fanfic');

        const ocrShowBtnCheckbox = wrapper.querySelector('#tm-show-ocr-btn');
        const ocrActionModeSelect = wrapper.querySelector('#tm-ocr-action-mode');
        const ocrImageSourceSelect = wrapper.querySelector('#tm-ocr-image-source');
        const ocrSourceGroup = wrapper.querySelector('#tm-ocr-source-group');
        const ocrModeSelect = wrapper.querySelector('#tm-ocr-mode');
        const ocrStatusDiv = wrapper.querySelector('#tm-ocr-status');

        const updateOcrUiState = () => {
            const actionMode = ocrActionModeSelect.value;
            const source = ocrImageSourceSelect.value;

            // 1. Show/Hide Source Group
            if (actionMode === 'image') {
                ocrSourceGroup.style.display = 'block';
            } else {
                ocrSourceGroup.style.display = 'none';
            }

            // 2. Constraint Logic
            // Reset options first
            Array.from(ocrModeSelect.options).forEach(opt => opt.disabled = false);

            if (actionMode === 'image') {
                if (source === 'screen') {
                    // Screen -> Force Overlay
                    ocrModeSelect.value = 'overlay';
                    // Disable Popup option
                    Array.from(ocrModeSelect.options).find(o => o.value === 'popup').disabled = true;
                } else if (source === 'import') {
                    // Import -> Force Popup
                    ocrModeSelect.value = 'popup';
                    // Disable Overlay option
                    Array.from(ocrModeSelect.options).find(o => o.value === 'overlay').disabled = true;
                }
            } else {
                // Region mode -> Allow both? Region usually implies overlay or popup.
                // Current behavior supports both.
            }
        };

        // Init Values
        ocrActionModeSelect.value = config.ocrActionMode || 'region';
        ocrImageSourceSelect.value = config.ocrImageSource || 'screen';
        ocrModeSelect.value = config.ocrMode || 'overlay';

        // Add Listeners
        ocrActionModeSelect.addEventListener('change', updateOcrUiState);
        ocrImageSourceSelect.addEventListener('change', updateOcrUiState);

        // Initial Update
        updateOcrUiState();

        // ... (Existing code below)
        const extStatusText = wrapper.querySelector('#tm-ext-status-text');
        const extStatusIcon = wrapper.querySelector('#tm-ext-status-icon');
        const extCheckBtn = wrapper.querySelector('#tm-ext-check-btn');
        const extIndicator = wrapper.querySelector('#tm-ext-status-indicator');

        const checkExtensionStatus = async () => {
            extStatusText.textContent = "Đang kiểm tra...";
            extStatusIcon.textContent = "⏳";
            extIndicator.style.background = "#fff3cd";
            extIndicator.style.color = "#856404";

            await sleep(500);

            const meta = document.querySelector('meta[name="tm-extension-id"]');
            const isExtDetected = meta && meta.content;

            if (isExtDetected && !window.tmExtensionId) {
                window.tmExtensionId = meta.content;
            }

            if (isExtDetected) {
                // Check Version
                let versionText = "";
                let ver = null;
                try {
                    ver = await new Promise(r => chrome.runtime.sendMessage(window.tmExtensionId, { cmd: 'CMD_GET_VERSION' }, res => {
                        if (chrome.runtime.lastError) {
                            console.warn("[TM-Translate] Check Version Failed:", chrome.runtime.lastError.message);
                            r(null);
                        } else {
                            r(res?.version);
                        }
                    }));
                    if (ver) versionText = ` (v${ver})`;
                } catch (e) { console.warn("Check Ver Err:", e); }

                let warningHtml = "";
                const minVer = "2.1";
                let isOutdated = true;

                if (ver) {
                    const v1 = ver.split('.').map(n => parseInt(n, 10) || 0);
                    const v2 = minVer.split('.').map(n => parseInt(n, 10) || 0);
                    // Compare logic
                    if (v1[0] > v2[0]) isOutdated = false;
                    else if (v1[0] === v2[0] && v1[1] >= v2[1]) isOutdated = false;
                }

                if (isOutdated) {
                    warningHtml = `<div style="color: #c0392b; font-size: 12px; margin-top: 4px; font-weight: bold;">⚠️ Extension đã cũ (Yêu cầu v${minVer}+). Hãy cập nhật ngay!</div>`;
                }

                extStatusText.innerHTML = `<b>Extension: Đã kết nối${versionText}</b> (Chạy nhanh)${warningHtml}`;
                extStatusIcon.textContent = "✅";
                extIndicator.style.background = "#d4edda";
                extIndicator.style.color = "#155724";
            } else {
                extStatusText.innerHTML = "<b>Extension: Chưa cài</b> (Chạy chậm / Script Only)";
                extStatusIcon.textContent = "⚠️";
                extIndicator.style.background = "#fff3cd";
                extIndicator.style.color = "#856404";
            }
        };

        extCheckBtn.addEventListener('click', () => {
            extCheckBtn.style.transform = 'rotate(360deg)';
            extCheckBtn.style.transition = 'transform 0.5s';
            checkExtensionStatus().then(() => {
                setTimeout(() => { extCheckBtn.style.transform = 'none'; extCheckBtn.style.transition = 'none'; }, 500);
            });
        });

        // Initial Check
        checkExtensionStatus();
        const ocrClearBtn = wrapper.querySelector('#tm-ocr-clear-cache');
        const ocrImportBtn = wrapper.querySelector('#tm-ocr-import-btn');
        const ocrImportInput = wrapper.querySelector('#tm-ocr-import-input');

        ocrImportBtn.onclick = () => ocrImportInput.click();
        ocrImportInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (confirm(`Bạn có chắc muốn cài model từ file "${file.name}"?`)) {
                try {
                    wrapper.remove(); // Close modal to show loading
                    await paddleService.importZip(file);
                } catch (err) {
                    console.error(err);
                    alert("Cài đặt thất bại: " + err.message);
                }
            }
        };

        const localDictSelect = wrapper.querySelector('#tm-local-dict-select');
        const localDictSearch = wrapper.querySelector('#tm-local-dict-search');
        const localDictResults = wrapper.querySelector('#tm-local-dict-results');
        const localDictPagination = wrapper.querySelector('#tm-local-dict-pagination');
        const prevBtn = wrapper.querySelector('#tm-local-prev-btn');
        const nextBtn = wrapper.querySelector('#tm-local-next-btn');
        const pageInfo = wrapper.querySelector('#tm-local-page-info');
        const addBtn = wrapper.querySelector('#tm-local-dict-add');
        const restoreBtn = wrapper.querySelector('#tm-local-dict-restore');

        async function initLocalDictTab() {
            if (!window.TranslateZhToVi || !window.TranslateZhToVi.isReady) {
                localDictResults.innerHTML = `<p style="padding: 10px; color: #c0392b;">Chế độ dịch Local chưa được khởi tạo. Hãy chuyển sang chế độ "Local" ở tab Chung, sau đó dịch thử một lần để tải từ điển.</p>`;
                localDictSearch.disabled = true;
                addBtn.disabled = true;
                localDictPagination.style.display = 'none';
                return;
            }
            localDictSearch.disabled = false;
            addBtn.disabled = false;
            localDictPagination.style.display = 'flex';
            renderLocalDictPage();
        }

        // Gắn các Event Listener
        localDictSelect.addEventListener('change', (e) => {
            localDictState.dictKey = e.target.value;
            localDictState.currentPage = 1;
            localDictState.filter = '';
            localDictSearch.value = '';
            renderLocalDictPage();
        });

        let searchDebounce;
        localDictSearch.addEventListener('input', (e) => {
            clearTimeout(searchDebounce);
            searchDebounce = setTimeout(() => {
                localDictState.filter = e.target.value.trim();
                localDictState.currentPage = 1;
                renderLocalDictPage();
            }, 300); // Chờ 300ms sau khi ngừng gõ mới tìm
        });

        prevBtn.addEventListener('click', () => {
            if (localDictState.currentPage > 1) {
                localDictState.currentPage--;
                renderLocalDictPage();
            }
        });

        nextBtn.addEventListener('click', () => {
            localDictState.currentPage++;
            renderLocalDictPage();
        });

        addBtn.addEventListener('click', () => {
            showLocalDictEntryModal('', '');
        });

        restoreBtn.addEventListener('click', async () => {
            if (confirm('Hành động này sẽ xóa toàn bộ cache từ điển local, bao gồm mọi thay đổi bạn đã lưu. Lần dịch tiếp theo sẽ tải lại từ điển gốc từ mạng. Bạn chắc chắn muốn tiếp tục?')) {
                await window.TranslateZhToVi.clearCache();
                alert('Đã xóa cache. Vui lòng đóng và mở lại cài đặt, sau đó dịch lại trang để tải từ điển mới.');
                initLocalDictTab();
            }
        });

        // Event Delegation cho các nút Sửa/Xóa
        localDictResults.addEventListener('click', async (e) => {
            const target = e.target.closest('button[data-action]');
            if (!target) return;

            const action = target.dataset.action;
            const key = target.dataset.key;
            const dictKey = localDictState.dictKey;
            const dictData = window.TranslateZhToVi._raw[dictKey];

            if (action === 'delete') {
                if (confirm(`Bạn chắc chắn muốn xóa mục "${key}"?`)) {
                    delete dictData[key];
                    if (await saveLocalDictChanges(dictKey)) {
                        renderLocalDictPage();
                    }
                }
            } else if (action === 'edit') {
                const entry = dictData[key];
                const valueString = Array.isArray(entry.alts) ? entry.alts.join(' / ') : entry.val;
                showLocalDictEntryModal(key, valueString);
            }
        });

        wrapper.querySelector('[data-tab="localedit"]').addEventListener('click', initLocalDictTab);

        document.body.appendChild(wrapper);

        // --- Tab logic ---
        const nameEditingCheckbox = wrapper.querySelector('#tm-name-editing-enabled');
        const copyContainer = wrapper.querySelector('#tm-allow-copy-container');

        function toggleCopyOptionVisibility() {
            copyContainer.style.display = nameEditingCheckbox.checked ? 'block' : 'none';
        }
        nameEditingCheckbox.addEventListener('change', toggleCopyOptionVisibility);

        const tabs = wrapper.querySelectorAll('.tm-tab-btn');
        const contents = wrapper.querySelectorAll('.tm-tab-content');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                wrapper.querySelector(`#tab-${tab.dataset.tab}`).classList.add('active');

            });
        });

        // --- Import / Export Logic ---
        const fileInput = wrapper.querySelector('#tm-import-file');
        wrapper.querySelector('#tm-import-btn').addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const content = e.target.result;
                    const setName = setSelect.value;
                    let newNames = {};
                    let count = 0;

                    if (file.name.endsWith('.json')) {
                        newNames = JSON.parse(content);
                    } else if (file.name.endsWith('.txt')) {
                        content.split(/\r?\n/).forEach(line => {
                            const parts = line.split('=');
                            if (parts.length === 2 && parts[0].trim() && parts[1].trim()) {
                                newNames[parts[0].trim()] = parts[1].trim();
                            }
                        });
                    } else {
                        alert('Chỉ hỗ trợ file .json hoặc .txt');
                        return;
                    }

                    if (confirm(`Bạn có chắc muốn nhập ${Object.keys(newNames).length} tên vào bộ "${setName}"? Các tên trùng lặp sẽ bị ghi đè.`)) {
                        Object.assign(config.nameSets[setName], newNames);
                        count = Object.keys(newNames).length;
                        alert(`Đã nhập thành công ${count} tên.`);
                        refreshNameSetPreview();
                    }
                } catch (err) {
                    alert('Lỗi khi đọc file. File có thể bị hỏng hoặc sai định dạng.\n' + err);
                } finally {
                    fileInput.value = ''; // Reset input
                }
            };
            reader.readAsText(file);
        });

        const triggerDownload = (filename, content, mimeType) => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(new Blob([content], { type: mimeType }));
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);
        };

        wrapper.querySelector('#tm-export-json-btn').addEventListener('click', () => {
            const setName = setSelect.value;
            const names = config.nameSets[setName];
            const content = JSON.stringify(names, null, 2);
            triggerDownload(`${setName}.json`, content, 'application/json');
        });

        wrapper.querySelector('#tm-export-txt-btn').addEventListener('click', () => {
            const setName = setSelect.value;
            const names = config.nameSets[setName];
            const content = Object.entries(names).map(([k, v]) => `${k}=${v}`).join('\n');
            triggerDownload(`${setName}.txt`, content, 'text/plain');
        });

        wrapper.querySelector('#tm-clearset').addEventListener('click', () => {
            const setName = setSelect.value;
            if (confirm(`Bạn có chắc muốn XÓA TẤT CẢ name trong bộ "${setName}"? Hành động này không thể hoàn tác.`)) {
                config.nameSets[setName] = {};
                refreshNameSetPreview();
                alert(`Đã xóa tất cả name trong bộ "${setName}".`);
            }
        });

        // --- Name Set Logic ---
        const setSelect = wrapper.querySelector('#tm-sets');
        const previewBox = wrapper.querySelector('#tm-preview');
        const currentSetNameSpan = wrapper.querySelector('#tm-current-set-name');

        function refreshNameSetPreview() {
            const setName = setSelect.value;
            currentSetNameSpan.textContent = setName;
            previewBox.innerHTML = '';
            const ns = config.nameSets[setName] || {};
            const keys = Object.keys(ns).sort((a, b) => a.localeCompare(b));
            if (keys.length === 0) {
                previewBox.innerHTML = '<div style="padding:10px; color:#888;">Bộ này trống.</div>';
                return;
            }
            keys.forEach(k => {
                const div = document.createElement('div');
                div.style.padding = '6px';
                div.style.borderBottom = '1px solid #eee';
                div.innerHTML = `<strong>${escapeHtml(k)}</strong> → ${escapeHtml(ns[k])}
                <button data-action="delete" data-key="${escapeHtml(k)}" class="tm-btn" style="float:right; padding: 2px 8px;">Xóa</button>
                <button data-action="edit" data-key="${escapeHtml(k)}" class="tm-btn" style="float:right; padding: 2px 8px; margin-right: 5px;">Sửa</button>`;
                previewBox.appendChild(div);
            });
        }

        function refreshSetSelector() {
            const currentVal = config.activeNameSet;
            setSelect.innerHTML = '';
            Object.keys(config.nameSets).forEach(name => {
                const opt = document.createElement('option');
                opt.value = opt.textContent = name;
                setSelect.appendChild(opt);
            });
            setSelect.value = currentVal;
            refreshNameSetPreview();
        }

        setSelect.addEventListener('change', () => {
            config.activeNameSet = setSelect.value;
            refreshNameSetPreview();
        });

        previewBox.addEventListener('click', e => {
            if (e.target.tagName !== 'BUTTON') return;
            const key = e.target.dataset.key;
            const action = e.target.dataset.action;
            const setName = setSelect.value;

            if (action === 'delete') {
                if (confirm(`Bạn có chắc muốn xóa cặp "${key}" khỏi bộ "${setName}"?`)) {
                    delete config.nameSets[setName][key];
                    refreshNameSetPreview();
                }
            } else if (action === 'edit') {
                const currentViet = config.nameSets[setName][key];
                const newViet = prompt(`Nhập tên tiếng Việt mới cho "${key}":`, currentViet);
                if (newViet !== null && newViet.trim() !== currentViet) {
                    config.nameSets[setName][key] = newViet.trim();
                    refreshNameSetPreview();
                }
            }
        });

        wrapper.querySelector('#tm-newset').addEventListener('click', () => {
            const name = prompt('Nhập tên cho bộ mới:');
            if (name && !config.nameSets[name]) {
                config.nameSets[name] = {};
                config.activeNameSet = name;
                refreshSetSelector();
            } else if (name) {
                alert('Tên bộ đã tồn tại.');
            }
        });

        wrapper.querySelector('#tm-delset').addEventListener('click', () => {
            const setName = setSelect.value;
            if (Object.keys(config.nameSets).length <= 1) {
                alert('Không thể xóa bộ tên cuối cùng.');
                return;
            }
            if (confirm(`Bạn có chắc muốn XÓA TOÀN BỘ bộ tên "${setName}"? Hành động này không thể hoàn tác.`)) {
                delete config.nameSets[setName];
                config.activeNameSet = Object.keys(config.nameSets)[0];
                refreshSetSelector();
            }
        });

        wrapper.querySelector('#tm-save-pairs').addEventListener('click', () => {
            const pairsArea = wrapper.querySelector('#tm-pairs');
            const lines = pairsArea.value.trim().split(/\r?\n/).filter(Boolean);
            const setName = setSelect.value;
            if (!config.nameSets[setName]) config.nameSets[setName] = {};
            let count = 0;
            lines.forEach(line => {
                const parts = line.split('=');
                if (parts.length === 2) {
                    const ch = parts[0].trim();
                    const vi = parts[1].trim();
                    if (ch && vi) {
                        config.nameSets[setName][ch] = vi;
                        count++;
                    }
                }
            });
            if (count > 0) {
                alert(`Đã thêm/cập nhật ${count} cặp tên.`);
                pairsArea.value = '';
                refreshNameSetPreview();
            } else {
                alert('Không có cặp tên hợp lệ nào được tìm thấy. Vui lòng kiểm tra định dạng (Trung=Việt).');
            }
        });

        // --- LOGIC BLACKLIST ---
        const blInput = wrapper.querySelector('#tm-blacklist-input');
        const blContainer = wrapper.querySelector('#tm-blacklist-container');
        const blAddBtn = wrapper.querySelector('#tm-blacklist-add');
        const blBlockCurrentBtn = wrapper.querySelector('#tm-blacklist-block-current');

        let tempBlacklist = [...(config.blacklist || [])];

        function renderBlacklist() {
            blContainer.innerHTML = '';
            if (tempBlacklist.length === 0) {
                blContainer.innerHTML = '<p style="padding:10px; color:#999;">Danh sách trống.</p>';
                return;
            }
            tempBlacklist.forEach((domain, index) => {
                const div = document.createElement('div');
                div.style.cssText = 'padding: 6px; border-bottom: 1px solid #eee; display:flex; justify-content:space-between; align-items:center;';
                div.innerHTML = `
                    <span>${escapeHtml(domain)}</span>
                    <button class="tm-btn tm-blacklist-del" data-idx="${index}" style="padding: 2px 8px; font-size:12px;">Xóa</button>
                `;
                blContainer.appendChild(div);
            });

            wrapper.querySelectorAll('.tm-blacklist-del').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const idx = parseInt(e.target.dataset.idx);
                    tempBlacklist.splice(idx, 1);
                    renderBlacklist();
                });
            });
        }

        blAddBtn.addEventListener('click', () => {
            const val = blInput.value.trim().toLowerCase();
            if (val && !tempBlacklist.includes(val)) {
                tempBlacklist.push(val);
                blInput.value = '';
                renderBlacklist();
            } else if (tempBlacklist.includes(val)) {
                alert('Tên miền này đã có trong danh sách.');
            }
        });

        blBlockCurrentBtn.addEventListener('click', () => {
            const currentHost = window.location.hostname;
            if (!tempBlacklist.includes(currentHost)) {
                tempBlacklist.push(currentHost);
                renderBlacklist();
                alert(`Đã thêm "${currentHost}" vào danh sách chặn. Nhớ nhấn "Lưu & Đóng".`);
            } else {
                alert('Trang này đã bị chặn rồi.');
            }
        });

        // Nút mở tab (để render lần đầu)
        wrapper.querySelector('[data-tab="blacklist"]').addEventListener('click', renderBlacklist);

        // --- Init fields & Save ---
        wrapper.querySelector('#tm-translation-mode').value = config.translationMode || 'server';
        serverProviderSelect.value = config.serverProvider || 'dichngay';
        wrapper.querySelector('#tm-simplified').value = config.simplifiedEnabled ? '1' : '0';
        wrapper.querySelector('#tm-simplified-js').checked = !!config.simplifiedBlockJS;
        wrapper.querySelector('#tm-override-font-enabled').checked = !!config.overrideFontEnabled;
        wrapper.querySelector('#tm-override-font-family').value = config.overrideFontFamily;
        wrapper.querySelector('#tm-show-start-btn').checked = !!config.showStartButton;
        wrapper.querySelector('#tm-show-quick-btn').checked = !!config.showQuickTranslateButton;
        wrapper.querySelector('#tm-show-restore-btn').checked = config.showRestoreButton !== false;
        wrapper.querySelector('#tm-auto-translate-scroll').checked = !!config.autoTranslateOnScroll;
        wrapper.querySelector('#tm-name-editing-enabled').checked = !!config.nameEditingEnabled;
        wrapper.querySelector('#tm-allow-copy-checkbox').checked = !!config.allowCopyWhenEditing;
        const serverEndpointsState = { ...config.serverEndpoints };
        const currentDnOptions = getDichnhanhOptions();
        dnModeSelect.value = currentDnOptions.mode;
        dnTypeSelect.value = currentDnOptions.type;
        dnAnalyzeCheckbox.checked = currentDnOptions.enableAnalyze;
        dnFanficCheckbox.checked = currentDnOptions.enableFanfic;
        function applyServerProviderUI() {
            const provider = serverProviderSelect.value;
            const resolvedUrl = serverEndpointsState[provider] || SERVER_PROVIDER_DEFAULTS[provider] || '';
            serverUrlInput.value = resolvedUrl;
            serverUrlInput.title = provider === 'dichnhanh'
                ? 'API dichnhanh mặc định. Sửa giá trị này nếu bạn có endpoint riêng.'
                : '';
            if (dnOptionsWrapper) {
                dnOptionsWrapper.style.display = provider === 'dichnhanh' ? 'block' : 'none';
            }
        }
        let lastServerProvider = serverProviderSelect.value;
        applyServerProviderUI();
        serverProviderSelect.addEventListener('change', () => {
            const trimmed = serverUrlInput.value.trim();
            if (lastServerProvider) {
                serverEndpointsState[lastServerProvider] = trimmed || (SERVER_PROVIDER_DEFAULTS[lastServerProvider] || '');
            }
            lastServerProvider = serverProviderSelect.value;
            applyServerProviderUI();
        });

        refreshSetSelector();
        toggleCopyOptionVisibility();

        // --- OCR Logic UI ---
        const ocrFontSelect = wrapper.querySelector('#tm-ocr-font');
        ocrShowBtnCheckbox.checked = !!config.showOcrButton;
        ocrModeSelect.value = config.ocrMode || 'popup';
        ocrFontSelect.value = config.ocrFont || 'Noto Serif';

        updateOcrStatus = async function () {
            try {
                // Check version first
                const ver = await GM_getValue(paddleService.cacheKey + "_ver", null);
                let allFilesExist = true;
                let totalSize = 0;
                let keys = [];

                if (ver === paddleService.cacheVersion) {
                    for (const file of paddleService.files) {
                        const v = await GM_getValue(paddleService.cacheKey + ":" + file, null);
                        if (!v) {
                            allFilesExist = false;
                            break;
                        }
                        keys.push(file);
                        totalSize += v.length;
                    }
                } else {
                    allFilesExist = false;
                }

                let text = '';
                if (!allFilesExist) {
                    text = '<span style="color:#d9534f">⚠️ Models chưa tải (Sẽ tự tải khi dùng lần đầu).</span>';
                } else {
                    const sizeMB = (totalSize * 0.75 / 1024 / 1024).toFixed(2); // Base64 ~1.33x -> 0.75
                    text = `<span style="color:#28a745">✅ Đã tải Models (v${paddleService.cacheVersion}).</span><br>• Files: ${keys.join(', ')}<br>• Dung lượng thực: ~${sizeMB} MB`;
                }

                const wasmCacheKey = "paddleocr_ort_wasm_v1_18_0";
                const wasmB64 = await GM_getValue(wasmCacheKey, null);
                if (wasmB64) {
                    const wSize = (wasmB64.length * 0.75 / 1024 / 1024).toFixed(2);
                    text += `<br><span style="color:#28a745">✅ Đã Cache WASM Runtime.</span> (~${wSize} MB)`;
                } else {
                    text += `<br><span style="color:#f0ad4e">⚠️ Chưa cache WASM (Sẽ tải khi dùng lần đầu).</span>`;
                }

                ocrStatusDiv.innerHTML = text;
            } catch (e) {
                ocrStatusDiv.textContent = 'Không thể kiểm tra trạng thái: ' + e.message;
            }
        };
        updateOcrStatus();

        ocrClearBtn.addEventListener('click', async () => {
            if (confirm("Bạn có chắc muốn xóa toàn bộ Cache OCR (Models & WASM)?\nLần sau sử dụng sẽ phải tải lại từ đầu.")) {
                try {
                    await GM_deleteValue(paddleService.cacheKey);
                    await GM_deleteValue(paddleService.cacheKey + '_ver');
                    await GM_deleteValue("paddleocr_ort_wasm_v1_18_0");
                    await GM_deleteValue("paddleocr_ort_wasm_v1_18_0_meta");
                    alert("Đã xóa cache thành công!");
                    updateOcrStatus();
                } catch (e) { alert("Lỗi xóa cache: " + e); }
            }
        });

        const close = () => {
            if (isSaving) return;

            const tempConfigCheck = JSON.parse(configSnapshot);
            tempConfigCheck.translationMode = wrapper.querySelector('#tm-translation-mode').value;
            tempConfigCheck.nameEditingEnabled = wrapper.querySelector('#tm-name-editing-enabled').checked;
            tempConfigCheck.allowCopyWhenEditing = wrapper.querySelector('#tm-allow-copy-checkbox').checked;
            tempConfigCheck.showStartButton = wrapper.querySelector('#tm-show-start-btn').checked;
            tempConfigCheck.showQuickTranslateButton = wrapper.querySelector('#tm-show-quick-btn').checked;
            tempConfigCheck.showRestoreButton = wrapper.querySelector('#tm-show-restore-btn').checked;
            tempConfigCheck.autoTranslateOnScroll = wrapper.querySelector('#tm-auto-translate-scroll').checked;
            tempConfigCheck.simplifiedEnabled = wrapper.querySelector('#tm-simplified').value === '1';
            tempConfigCheck.overrideFontEnabled = wrapper.querySelector('#tm-override-font-enabled').checked;
            tempConfigCheck.overrideFontFamily = wrapper.querySelector('#tm-override-font-family').value;
            tempConfigCheck.showOcrButton = wrapper.querySelector('#tm-show-ocr-btn').checked;
            tempConfigCheck.ocrMode = wrapper.querySelector('#tm-ocr-mode').value;
            tempConfigCheck.ocrActionMode = wrapper.querySelector('#tm-ocr-action-mode').value;
            tempConfigCheck.ocrImageSource = wrapper.querySelector('#tm-ocr-image-source').value;
            tempConfigCheck.ocrTextScaleFactor = parseFloat(wrapper.querySelector('#tm-ocr-scale').value) || 1.8;

            const provider = serverProviderSelect.value;
            const tempEndpoints = { ...tempConfigCheck.serverEndpoints };
            tempEndpoints[provider] = serverUrlInput.value.trim() || (SERVER_PROVIDER_DEFAULTS[provider] || '');
            tempConfigCheck.serverProvider = provider;
            tempConfigCheck.serverEndpoints = tempEndpoints;

            tempConfigCheck.dichnhanhOptions = {
                mode: dnModeSelect.value,
                type: dnTypeSelect.value === 'Modern' ? 'Modern' : 'Ancient',
                enableAnalyze: dnAnalyzeCheckbox.checked,
                enableFanfic: dnFanficCheckbox.checked
            };
            tempConfigCheck.hanvietJsonUrl = wrapper.querySelector('#tm-hv-url').value.trim();
            tempConfigCheck.delayMs = parseInt(wrapper.querySelector('#tm-delay').value, 10);
            tempConfigCheck.maxCharsPerRequest = parseInt(wrapper.querySelector('#tm-max').value, 10);
            tempConfigCheck.activeNameSet = setSelect.value;

            tempConfigCheck.nameSets = config.nameSets;
            tempConfigCheck.blacklist = tempBlacklist;

            const newConfigSnapshot = JSON.stringify(tempConfigCheck);

            if (newConfigSnapshot !== configSnapshot) {
                if (confirm("Bạn đã thay đổi cài đặt! Bạn có muốn lưu lại không?")) {
                    saveChanges();
                } else {
                    wrapper.remove();
                }
            } else {
                wrapper.remove();
            }
        };
        wrapper.querySelector('.tm-modal-backdrop').addEventListener('click', close);
        wrapper.querySelector('#tm-settings-cancel').addEventListener('click', close);
        wrapper.querySelector('#tm-settings-close').addEventListener('click', close);

        const saveChanges = () => {
            isSaving = true; // Đặt cờ, báo là đang lưu

            const oldBL = JSON.stringify(config.blacklist || []);
            const newBL = JSON.stringify(tempBlacklist || []);
            const isBlacklistChanged = oldBL !== newBL;

            const trimmedServerUrl = serverUrlInput.value.trim();
            serverEndpointsState[serverProviderSelect.value] = trimmedServerUrl || (SERVER_PROVIDER_DEFAULTS[serverProviderSelect.value] || '');
            config.translationMode = wrapper.querySelector('#tm-translation-mode').value;
            config.serverProvider = serverProviderSelect.value;
            const oldNameEditing = config.nameEditingEnabled;
            config.nameEditingEnabled = wrapper.querySelector('#tm-name-editing-enabled').checked;
            config.allowCopyWhenEditing = wrapper.querySelector('#tm-allow-copy-checkbox').checked;

            const oldAutoTranslate = config.autoTranslateOnScroll;
            config.showStartButton = wrapper.querySelector('#tm-show-start-btn').checked;
            config.showQuickTranslateButton = wrapper.querySelector('#tm-show-quick-btn').checked;
            config.showRestoreButton = wrapper.querySelector('#tm-show-restore-btn').checked;
            config.autoTranslateOnScroll = wrapper.querySelector('#tm-auto-translate-scroll').checked;
            config.simplifiedEnabled = wrapper.querySelector('#tm-simplified').value === '1';
            config.overrideFontEnabled = wrapper.querySelector('#tm-override-font-enabled').checked;
            config.overrideFontFamily = wrapper.querySelector('#tm-override-font-family').value;
            config.showOcrButton = wrapper.querySelector('#tm-show-ocr-btn').checked;
            config.ocrMode = wrapper.querySelector('#tm-ocr-mode').value;
            config.ocrActionMode = wrapper.querySelector('#tm-ocr-action-mode').value;
            config.ocrImageSource = wrapper.querySelector('#tm-ocr-image-source').value;
            config.ocrFont = wrapper.querySelector('#tm-ocr-font').value;
            config.ocrTextScaleFactor = parseFloat(wrapper.querySelector('#tm-ocr-scale').value) || 1.8;
            // Advanced
            config.serverEndpoints = { ...serverEndpointsState };
            config.serverUrl = config.serverEndpoints.dichngay || SERVER_PROVIDER_DEFAULTS.dichngay;
            config.dichnhanhOptions = {
                mode: dnModeSelect.value,
                type: dnTypeSelect.value === 'Modern' ? 'Modern' : 'Ancient',
                enableAnalyze: dnAnalyzeCheckbox.checked,
                enableFanfic: dnFanficCheckbox.checked
            };
            config.hanvietJsonUrl = wrapper.querySelector('#tm-hv-url').value.trim();
            config.delayMs = parseInt(wrapper.querySelector('#tm-delay').value, 10);
            config.maxCharsPerRequest = parseInt(wrapper.querySelector('#tm-max').value, 10);

            config.blacklist = tempBlacklist;

            config.activeNameSet = setSelect.value;
            saveConfig(config);

            wrapper.remove(); // Đóng modal sau khi lưu
            if (isBlacklistChanged) {
                console.log('[tm-translate] Danh sách chặn đã thay đổi. Đang tải lại trang...');
                syncBlacklistToExtension(config.blacklist).then(() => {
                    location.reload();
                });
                return;
            }
            showNotification('Đã lưu cài đặt.', 2000);

            updateFloatingButtons(); // Cập nhật nút nổi

            if (translatedBodyClone) {
                console.log("Phát hiện thay đổi cài đặt khi trang đã dịch. Bắt đầu dịch lại thông minh...");
                const newNameSet = config.nameSets[config.activeNameSet] || {};
                applyNameChangeLive(newNameSet, oldNameSetSnapshot);
            }
        };

        wrapper.querySelector('#tm-settings-save').addEventListener('click', saveChanges);
    }

    function gmFetchArrayBuffer(url) {
        return new Promise((resolve, reject) => {
            let abortFn = null;
            const safeTimeout = setTimeout(() => {
                if (abortFn) abortFn();
                reject(new Error("Request Timed Out (Safety)"));
            }, 65000);

            const request = GM_xmlhttpRequest({
                method: "GET",
                url,
                responseType: "arraybuffer",
                fetch: true, // Restore fetch as required
                // anonymous: true, // Removed per user feedback
                timeout: 60000,
                headers: { "Cache-Control": "no-cache" },
                onload: (r) => {
                    clearTimeout(safeTimeout);
                    if (r.status >= 200 && r.status < 300) resolve(r.response);
                    else reject(new Error(`HTTP ${r.status}`));
                },
                onerror: (e) => {
                    clearTimeout(safeTimeout);
                    console.warn("[DL] Network Error:", e);
                    reject(new Error("Network Error"));
                },
                ontimeout: () => {
                    clearTimeout(safeTimeout);
                    reject(new Error("Timeout"));
                },
                onprogress: (e) => {
                    if (window.suppressDownloadUI) return; // Silent mode

                    if (e.lengthComputable && e.total > 0) {
                        let pct = (e.loaded / e.total * 100);
                        if (pct > 99) pct = 99; // Cap at 99% until fully loaded
                        showLoading(`Đang tải... ${pct.toFixed(0)}%`);
                    } else {
                        showLoading(`Đang tải... ${(e.loaded / 1024 / 1024).toFixed(1)}MB`);
                    }
                }
            });
            if (request && typeof request.abort === 'function') abortFn = request.abort;
        });
    }

    function gmFetchText(url) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "GET",
                url,
                responseType: "text",
                onload: (r) => {
                    if (r.status >= 200 && r.status < 300) resolve(r.responseText);
                    else reject(new Error(`GET ${url} failed: ${r.status}`));
                },
                onerror: () => reject(new Error(`GET ${url} network error`)),
            });
        });
    }

    let __ortPromise = null;

    async function ensureOrtSandbox() {
        if (__ortPromise) return __ortPromise;

        __ortPromise = (async () => {
            if (typeof SharedArrayBuffer === 'undefined') {
                const SafeBuffer = typeof ArrayBuffer !== 'undefined' ? ArrayBuffer : null;
                if (SafeBuffer) {
                    if (typeof window !== 'undefined') window.SharedArrayBuffer = SafeBuffer;
                    if (typeof globalThis !== 'undefined') globalThis.SharedArrayBuffer = SafeBuffer;
                    if (typeof self !== 'undefined') self.SharedArrayBuffer = SafeBuffer;
                    console.log("[TM-Translate] Polyfilled SharedArrayBuffer -> ArrayBuffer");
                }
            }

            // --- Monkey-Patch fetch & XHR for WASM Injection ---
            if (!window.__tmFetchPatched) {
                const patchTarget = (target) => {
                    if (!target || target.__tmFetchPatched) return;

                    const isOrtWasm = (url) => {
                        return url &&
                            (url.endsWith('.wasm') || url.includes('.wasm?')) &&
                            url.includes('ort-wasm');
                    };

                    const originalFetch = target.fetch;
                    target.fetch = async function (input, init) {
                        const url = typeof input === 'string' ? input : (input instanceof URL ? input.href : input.url);
                        const buffer = window.__TM_WASM_BUFFER || (typeof unsafeWindow !== 'undefined' ? unsafeWindow.__TM_WASM_BUFFER : null);

                        if (isOrtWasm(url) && buffer) {
                            console.log(`[TM-Translate] Intercepted ORT WASM fetch (${target === window ? 'window' : 'unsafe'}): ${url}`);
                            return new Response(buffer, {
                                status: 200,
                                headers: { 'Content-Type': 'application/wasm' }
                            });
                        }
                        return originalFetch.apply(this, arguments);
                    };

                    const originalOpen = target.XMLHttpRequest.prototype.open;
                    target.XMLHttpRequest.prototype.open = function (method, url) {
                        if (url && (typeof url === 'string') && isOrtWasm(url)) {
                            this._isWasmRequest = true;
                            this._wasmUrl = url;
                        }
                        return originalOpen.apply(this, arguments);
                    };

                    const originalSend = target.XMLHttpRequest.prototype.send;
                    target.XMLHttpRequest.prototype.send = function (body) {
                        const buffer = window.__TM_WASM_BUFFER || (typeof unsafeWindow !== 'undefined' ? unsafeWindow.__TM_WASM_BUFFER : null);
                        if (this._isWasmRequest && buffer) {
                            console.log(`[TM-Translate] Intercepted ORT WASM XHR (${target === window ? 'window' : 'unsafe'}): ${this._wasmUrl}`);

                            Object.defineProperty(this, 'status', { value: 200 });
                            Object.defineProperty(this, 'readyState', { value: 4 });
                            Object.defineProperty(this, 'response', { value: buffer });
                            Object.defineProperty(this, 'responseType', { value: 'arraybuffer' });

                            const event = new Event('load');
                            this.dispatchEvent(event);
                            if (this.onload) this.onload(event);
                            return;
                        }
                        return originalSend.apply(this, arguments);
                    };

                    target.__tmFetchPatched = true;
                };

                patchTarget(window);
                patchTarget(self);
                patchTarget(globalThis);
                if (typeof unsafeWindow !== 'undefined') patchTarget(unsafeWindow);

                console.log("[TM-Translate] Pre-patched fetch/XHR (All scopes) for WASM interception.");
            }

            const ortCode = await gmFetchText("https://unpkg.com/onnxruntime-web@1.18.0/dist/ort.wasm.min.js");
            const ort = (0, eval)(`${ortCode}\n; ort;`);
            if (!ort) throw new Error("Cannot obtain `ort` from ort.wasm.min.js");
            window.ort = ort;
            globalThis.ort = ort;
            return ort;
        })();

        return __ortPromise;
    }
    // --- EXTENSION COMMUNICATION HELPERS ---

    async function syncBlacklistToExtension(blacklist) {
        const extId = window.tmExtensionId || "";
        if (!extId) return;

        try {
            window.postMessage({ type: 'TM_EXT_UPDATE_BLACKLIST', domains: blacklist }, '*');
        } catch (e) {
            console.warn("Lỗi sync extension:", e);
        }
    }

    /* ================== OCR SERVICE ================== */

    const paddleService = {
        modelLoaded: false,
        ocrEngine: null,
        cacheKey: "paddleocr_models_v4",
        cacheVersion: "4.0.0",
        zipUrl: "https://github.com/xushengfeng/eSearch-OCR/releases/download/4.0.0/ch.zip",
        zipUrls: [
            "https://release-assets.githubusercontent.com/github-production-release-asset/439694660/f49fd7b8-78fa-4f1e-94c0-1c5235496edf?sp=r&sv=2018-11-09&sr=b&spr=https&se=2026-01-20T03%3A31%3A05Z&rscd=attachment%3B+filename%3Dch.zip&rsct=application%2Foctet-stream&skoid=96c2d410-5711-43a1-aedd-ab1947aa7ab0&sktid=398a6654-997b-47e9-b12b-9515b896b4de&skt=2026-01-20T02%3A30%3A19Z&ske=2026-01-20T03%3A31%3A05Z&sks=b&skv=2018-11-09&sig=v%2Fihzcj4nsrsz%2F5HEV4xTAAoEpCQ3GcvShSq3YyBXf0%3D&jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmVsZWFzZS1hc3NldHMuZ2l0aHVidXNlcmNvbnRlbnQuY29tIiwia2V5Ijoia2V5MSIsImV4cCI6MTc2ODg3ODE0NywibmJmIjoxNzY4ODc2MzQ3LCJwYXRoIjoicmVsZWFzZWFzc2V0cHJvZHVjdGlvbi5ibG9iLmNvcmUud2luZG93cy5uZXQifQ.xKZ9TVx9_LxSrpnlgj9lzNusgrbNbHFvzpQuEwV2fBM&response-content-disposition=attachment%3B%20filename%3Dch.zip&response-content-type=application%2Foctet-stream",
            "https://drive.usercontent.google.com/u/0/uc?id=1J2xfRuEzDZpuXPnRcBiWhp7ajb-INoGa&export=download",
            "https://ghfast.top/?q=https://github.com/xushengfeng/eSearch-OCR/releases/download/4.0.0/ch.zip",
            "https://github.com/xushengfeng/eSearch-OCR/releases/download/4.0.0/ch.zip"
        ],
        files: ["ppocr_keys_v1.txt", "ppocr_det.onnx", "ppocr_rec.onnx"],

        async init(quietMode = false) {
            if (this.modelLoaded && this.ocrEngine) return;

            if (!quietMode) showLoading('Đang khởi tạo PaddleOCR (Lần đầu sẽ tải model ~15MB)...');

            const G = (typeof globalThis !== "undefined" ? globalThis : window);
            const P = (typeof unsafeWindow !== "undefined" ? unsafeWindow : null);

            const ort = await ensureOrtSandbox();
            const eSearchOCR = G.eSearchOCR || G.ESearchOCR || G.eSearchOcr || (P && (P.eSearchOCR || P.ESearchOCR || P.eSearchOcr));

            if (!ort || !eSearchOCR) {
                console.log("DEBUG ort:", ort, "eSearchOCR:", eSearchOCR, "G keys ocr:", Object.keys(G).filter(k => k.toLowerCase().includes("ocr")));
                throw new Error("PaddleOCR deps missing (ort/eSearchOCR). Check sandbox/page global name.");
            }

            const initFn = eSearchOCR.init || eSearchOCR;


            if (ort.env && ort.env.wasm) {
                const isPolyfilled = typeof SharedArrayBuffer !== 'undefined' && SharedArrayBuffer === ArrayBuffer;
                const isSecureContext = typeof window !== 'undefined' && window.crossOriginIsolated;
                const canUseThreading = false; // FORCE DISABLE THREADING TO FIX LINK ERROR
                // const canUseThreading = typeof SharedArrayBuffer !== 'undefined' && !isPolyfilled && isSecureContext;
                ort.env.wasm.numThreads = 0;
                ort.env.wasm.simd = true;
                ort.env.logLevel = "verbose";

                console.log(`[TM-Translate] Fetching WASM via GM... Threading=${canUseThreading} (Polyfilled=${isPolyfilled}, Isolated=${isSecureContext})`);

                try {
                    const wasmCacheKey = "paddleocr_ort_wasm_v1_18_0";
                    let wasmBuffer = null;
                    let loadedCandidate = null;

                    let cachedB64 = await GM_getValue(wasmCacheKey, null);
                    let loadedFromCache = false;

                    if (cachedB64) {
                        try {
                            const binStr = window.atob(cachedB64);
                            const len = binStr.length;
                            const bytes = new Uint8Array(len);
                            for (let i = 0; i < len; i++) bytes[i] = binStr.charCodeAt(i);

                            wasmBuffer = bytes.buffer;
                            loadedCandidate = "Cached Model (v1.18.0)";
                            loadedFromCache = true;
                            console.log("[TM-Translate] Loaded WASM from Tampermonkey Storage.");
                        } catch (e) {
                            console.warn("[TM-Translate] Failed to parse cached WASM, cleaning up...", e);
                            await GM_deleteValue(wasmCacheKey);
                        }
                    }

                    if (!wasmBuffer) {
                        const candidates = canUseThreading
                            ? ["ort-wasm-simd-threaded.wasm", "ort-wasm-threaded.wasm", "ort-wasm-simd.wasm", "ort-wasm.wasm"]
                            : ["ort-wasm.wasm", "ort-wasm-simd.wasm"];

                        for (const fileName of candidates) {
                            try {
                                const url = `https://cdn.jsdelivr.net/npm/onnxruntime-web@1.18.0/dist/${fileName}`;
                                console.log(`[TM-Translate] Downloading WASM: ${fileName}`);
                                const buffer = await gmFetchArrayBuffer(url);
                                if (buffer && buffer.byteLength > 0) {
                                    wasmBuffer = buffer;
                                    loadedCandidate = fileName;
                                    break;
                                }
                            } catch (e) {
                                console.warn(`[TM-Translate] Failed to load ${fileName}:`, e.message);
                            }
                        }
                    }

                    if (!wasmBuffer) {
                        throw new Error("All WASM candidates failed to download (v1.18.0).");
                    }

                    if (!loadedFromCache) {
                        console.log(`[TM-Translate] Caching WASM (${loadedCandidate}) to storage...`);
                        try {
                            let binary = '';
                            const bytes = new Uint8Array(wasmBuffer);
                            const len = bytes.byteLength;
                            const chunkSize = 8192;
                            for (let i = 0; i < len; i += chunkSize) {
                                binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
                            }
                            const b64 = window.btoa(binary);

                            if (b64.length < 15 * 1024 * 1024) {
                                await GM_setValue(wasmCacheKey, b64);
                                await GM_setValue(wasmCacheKey + "_meta", { name: loadedCandidate });
                                console.log("[TM-Translate] WASM Cached successfully.");
                            } else {
                                console.warn("[TM-Translate] WASM too large to cache safely.");
                            }
                        } catch (e) {
                            console.warn("[TM-Translate] Failed to cache WASM:", e);
                        }
                    } else {
                        const meta = await GM_getValue(wasmCacheKey + "_meta", {});
                        if (meta.name) loadedCandidate = meta.name;
                    }

                    if (!wasmBuffer) {
                        throw new Error("All WASM candidates failed to download (v1.18.0).");
                    }
                    ort.env.wasm.wasmBinary = new Uint8Array(wasmBuffer);

                    window.__TM_WASM_BUFFER = wasmBuffer;
                    if (typeof unsafeWindow !== 'undefined') unsafeWindow.__TM_WASM_BUFFER = wasmBuffer;
                    console.log("[TM-Translate] Assigned window.__TM_WASM_BUFFER for interception.");

                    ort.env.wasm.wasmPaths = undefined;

                    if (!canUseThreading) {
                        try {
                            Object.defineProperty(ort.env.wasm, 'numThreads', {
                                get: () => 0,
                                set: (v) => { console.warn(`[TM-Translate] Blocked attempt to set numThreads=${v} (Force 0)`); },
                                enumerable: true,
                                configurable: true
                            });
                            console.log("[TM-Translate] Soft-locked ort.env.wasm.numThreads = 0");
                        } catch (e) {
                            console.warn("Could not lock numThreads:", e);
                            ort.env.wasm.numThreads = 0;
                        }
                    } else {
                        ort.env.wasm.numThreads = 4;
                    }

                    const isSimd = loadedCandidate.includes('simd');
                    ort.env.wasm.simd = isSimd;
                    console.log(`[TM-Translate] Configured ORT: SIMD=${isSimd}, Threads=${ort.env.wasm.numThreads}`);

                    console.log(`[TM-Translate] ONNX WASM Loaded & Configured: ${loadedCandidate}`);

                } catch (e) {
                    console.error("[TM-Translate] Critical WASM Load Error:", e);
                    alert("Lỗi tải thư viện AI (WASM). Vui lòng thử lại hoặc kiểm tra mạng.");
                    throw e;
                }
            }

            let models = null;
            const version = await GM_getValue(this.cacheKey + "_ver", null);
            if (version === this.cacheVersion) {
                models = {};
                for (const file of this.files) {
                    const v = await GM_getValue(this.cacheKey + ":" + file, null);
                    if (!v) { models = null; break; }
                    models[file] = v;
                }
            }
            if (!models) {
                models = await this.downloadModels();
            }

            if (!quietMode) showLoading('Đang nạp Model vào bộ nhớ...');
            const detBuffer = this.base64ToArrayBuffer(models['ppocr_det.onnx']);
            const recBuffer = this.base64ToArrayBuffer(models['ppocr_rec.onnx']);
            const keysText = this.base64ToUtf8(models['ppocr_keys_v1.txt']);

            // --- Init Engine ---
            this.ocrEngine = await initFn({
                det: {
                    input: detBuffer,
                    ratio: 2.0,
                },
                rec: {
                    input: recBuffer,
                    decodeDic: keysText,
                    optimize: {
                        space: false,
                    },
                },
                dev: false,
                ort: ort,
            });

            this.modelLoaded = true;
        },

        async downloadModels() {
            let lastError;
            for (const url of this.zipUrls) {
                try {
                    console.log('Downloading model from:', url);
                    return await this.downloadModelFromUrl(url);
                } catch (e) {
                    console.warn(`Failed to download from ${url}:`, e);
                }
            }
        },

        async downloadModelFromUrl(url) {
            showLoading(`Đang tải model OCR từ ${new URL(url).hostname}...`);

            let arrayBuffer;
            let attempt = 0;
            const maxRetries = 3;

            while (attempt < maxRetries) {
                try {
                    arrayBuffer = await gmFetchArrayBuffer(url);
                    break; // Success
                } catch (e) {
                    attempt++;
                    console.warn(`[TM-Translate] Download failed (Attempt ${attempt}/${maxRetries}):`, e);
                    if (attempt >= maxRetries) {
                        alert(`Không thể tải Model sau ${maxRetries} lần thử.\nLỗi: ${e.message}\nVui lòng kiểm tra mạng và thử lại.`);
                        throw e;
                    }
                    showLoading(`Lỗi mạng. Đang thử lại (${attempt}/${maxRetries})...`);
                    await new Promise(r => setTimeout(r, 2000)); // Wait 2s before retry
                }
            }

            if (!arrayBuffer) throw new Error("Thất bại toàn tập khi tải Models.");

            showLoading("Tải xong, đang giải nén (fflate)...");
            return await this.processZipAndSave(arrayBuffer);
        },

        async importZip(file) {
            window.suppressDownloadUI = true; // Stop background download notifications
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    try {
                        await this.processZipAndSave(e.target.result);
                        resolve();
                    } catch (err) {
                        reject(err);
                    }
                };
                reader.onerror = reject;
                reader.readAsArrayBuffer(file);
            });
        },

        async processZipAndSave(arrayBuffer) {
            console.time("fflate.unzip");
            let unzipped = {};
            try {
                const u8 = new Uint8Array(arrayBuffer);
                unzipped = await new Promise((resolve, reject) => {
                    fflate.unzip(u8, (err, res) => {
                        if (err) reject(err);
                        else resolve(res);
                    });
                });
            } catch (e) {
                console.error("Unzip error:", e);
                alert("Lỗi giải nén ZIP: " + e.message);
                throw e;
            }
            console.timeEnd("fflate.unzip");
            await yieldUI();

            const models = {};
            showLoading("Đang xử lý file...");

            for (const file of this.files) {
                let fileData = unzipped[file];

                // Fallback search if not found directly
                if (!fileData) {
                    const foundKey = Object.keys(unzipped).find(k => k.endsWith(file) && !k.startsWith('__MACOSX'));
                    if (foundKey) fileData = unzipped[foundKey];
                }

                if (!fileData) {
                    console.warn(`File ${file} was not found in the zip archive.`);
                    continue;
                }

                console.log(`[TM-DEBUG] Processing ${file} (Size: ${fileData.length})`);
                showLoading("Đang encode " + file + "...");
                await yieldUI();

                if (file.endsWith('.onnx') || file.endsWith('.txt')) {
                    // Manual chunked conversion to Base64
                    let binary = '';
                    const len = fileData.byteLength;
                    const chunkSize = 32768; // 32KB
                    for (let i = 0; i < len; i += chunkSize) {
                        binary += String.fromCharCode.apply(null, fileData.subarray(i, Math.min(i + chunkSize, len)));
                    }
                    models[file] = window.btoa(binary);
                }
            }

            // Validation
            if (!models['ppocr_rec.onnx'] || !models['ppocr_det.onnx']) {
                throw new Error("File Zip không chứa đủ các model (ppocr_rec, ppocr_det).");
            }

            showLoading("Đang lưu cache...");
            console.time("GM_setValue cache");
            for (const [k, v] of Object.entries(models)) {
                await GM_setValue(this.cacheKey + ":" + k, v);
                await yieldUI();
            }
            await GM_setValue(this.cacheKey + "_ver", this.cacheVersion);
            await yieldUI();
            console.timeEnd("GM_setValue cache");

            removeLoading();

            if (typeof updateOcrStatus === 'function') updateOcrStatus();
            alert("Cài đặt Model thành công!");
            return models;
        },

        arrayBufferToBase64(buffer) {
            const bytes = new Uint8Array(buffer);
            const chunkSize = 0x8000; // 32KB
            let binary = "";
            for (let i = 0; i < bytes.length; i += chunkSize) {
                binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
            }
            return window.btoa(binary);
        },

        base64ToArrayBuffer(base64) {
            const binary_string = window.atob(base64);
            const len = binary_string.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binary_string.charCodeAt(i);
            }
            return bytes.buffer;
        },

        utf8ToBase64(str) {
            return window.btoa(unescape(encodeURIComponent(str)));
        },

        base64ToUtf8(base64) {
            return decodeURIComponent(escape(window.atob(base64)));
        },

        async recognize(imageSrc) {
            // Priority: Check Extension First
            const extMeta = document.querySelector('meta[name="tm-extension-id"]');
            const extId = window.tmExtensionId || (extMeta ? extMeta.content : null);

            if (extId) {
                console.log("[paddleService] Delegating to Extension:", extId);
                try {
                    const result = await new Promise((resolve, reject) => {
                        chrome.runtime.sendMessage(extId, {
                            cmd: 'CMD_OCR_RECOGNIZE',
                            image: imageSrc
                        }, response => {
                            if (chrome.runtime.lastError) {
                                console.warn("[paddleService] Extension Error:", chrome.runtime.lastError);
                                reject(chrome.runtime.lastError);
                            } else if (response && response.success) {
                                resolve(response.data);
                            } else {
                                reject(new Error(response ? response.error : 'Unknown Extension Error'));
                            }
                        });
                    });
                    return result;
                } catch (e) {
                    console.warn("[paddleService] Extension failed, falling back to Local WASM...", e);
                    // Fallback to local below
                }
            }

            // Fallback: Local WASM
            if (!this.modelLoaded) {
                await this.init();
            }
            showLoading('Đang nhận diện văn bản (Local WASM)...');
            let result;
            if (typeof this.ocrEngine === 'function') {
                result = await this.ocrEngine(imageSrc);
            } else if (typeof this.ocrEngine.recognize === 'function') {
                result = await this.ocrEngine.recognize(imageSrc);
            } else if (typeof this.ocrEngine.ocr === 'function') {
                result = await this.ocrEngine.ocr(imageSrc);
            } else {
                console.error("Unknown OCR Engine type:", this.ocrEngine);
                throw new Error("OCR Engine is not compatible.");
            }

            removeLoading();
            return result;
        }
    };



    async function handleOcrRequest(base64FullString, prefixToRemove, overlayContainer = null, screenRect = null) {
        try {
            const extMeta = document.querySelector('meta[name="tm-extension-id"]');
            const extId = extMeta ? extMeta.content : window.__TM_EXTENSION_ID;

            if (extId) {
                console.log("[TM UserScript] Extension Detected via DOM:", extId);
                if (overlayContainer) {
                    const statusEl = overlayContainer.querySelector('.tm-ocr-loading');
                    if (statusEl) statusEl.textContent = 'Đang gửi sang Ext...';
                }

                const ocrPromise = new Promise((resolve, reject) => {
                    const rqId = 'req_' + Date.now() + Math.random();

                    const handler = (event) => {
                        if (event.data && event.data.type === 'TM_EXT_OCR_RESPONSE' && event.data.reqId === rqId) {
                            console.log("[TM UserScript] Received Response from Content Script:", event.data);
                            window.removeEventListener('message', handler);

                            const res = event.data.data;
                            if (res.success) resolve(res.data);
                            else reject(new Error(res.error || "Unknown Extension Error"));
                        }
                    };
                    window.addEventListener('message', handler);

                    setTimeout(() => {
                        window.removeEventListener('message', handler);
                        reject(new Error("Extension Timeout (30s)"));
                    }, 30000);
                    console.log("[TM UserScript] Posting message to Content Script...", rqId);
                    window.postMessage({
                        type: 'TM_EXT_OCR_REQUEST',
                        reqId: rqId,
                        payload: { imageBase64: base64FullString }
                    }, '*');
                });

                let ocrText = '';
                let ocrData = null;

                try {
                    const response = await ocrPromise;
                    if (typeof response === 'object' && response !== null) {
                        ocrData = response;
                        ocrText = response.text || '';
                    } else {
                        ocrText = response;
                    }
                } catch (extErr) {
                    console.warn("Extension OCR failed, falling back to local...", extErr);
                    if (!paddleService.modelLoaded) {
                        await paddleService.init(!!overlayContainer);
                    }
                    const localRes = await paddleService.recognize(base64FullString);
                    if (typeof localRes === 'object') ocrText = localRes.text;
                    else ocrText = localRes;
                }

                if (!ocrText || (typeof ocrText === 'string' && !ocrText.trim())) {
                    if (overlayContainer) {
                        overlayContainer.remove();
                        alert('Không tìm thấy chữ nào (Ext).');
                    } else {
                        alert('Không tìm thấy chữ nào (Ext).');
                        removeLoading();
                    }
                    return;
                }

                if (overlayContainer) {
                    const statusEl = overlayContainer.querySelector('.tm-ocr-loading');
                    if (statusEl) statusEl.textContent = 'Đang dịch...';
                } else {
                    showLoading('Đang dịch văn bản...');
                }

                const cleanedText = ocrText.replace(/([^\x00-\xff])[^\S\r\n]+([^\x00-\xff])/g, '$1$2').trim();
                const returnType = config.nameEditingEnabled ? 'html' : 'text'; // Return HTML if editing is ON to include spans
                const translatedText = await translatePanelText(cleanedText, returnType);

                if (!overlayContainer) removeLoading();

                if (config.ocrMode === 'overlay' && overlayContainer && screenRect) {
                    updateOcrOverlayContent(overlayContainer, translatedText, screenRect);
                } else {
                    if (overlayContainer) {
                        overlayContainer.remove();
                    }
                    showImageTranslationResult(translatedText, ocrText, base64FullString);
                }

                return; // EXIT FUNCTION (EXTENSION PATH DONE)
            }

            const isOverlay = !!overlayContainer;

            if (isOverlay) {
                const statusEl = overlayContainer.querySelector('.tm-ocr-loading');
                if (statusEl && !paddleService.modelLoaded) statusEl.textContent = 'Đang tải Model (Lần đầu)...';
            }

            await paddleService.init(isOverlay);

            if (!overlayContainer) showLoading('Đang nhận diện chữ (Offline)...');
            else {
                const statusEl = overlayContainer.querySelector('.tm-ocr-loading');
                if (statusEl) statusEl.textContent = 'Đang nhận diện...';
            }

            const img = new Image();
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = base64FullString;
            });

            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            const result = await paddleService.ocrEngine.ocr(imageData);

            let ocrText = '';
            if (result && result.parragraphs) {
                ocrText = result.parragraphs.map(p => p.text).join('\n');
            }

            if (!ocrText || !ocrText.trim()) {
                if (overlayContainer) {
                    overlayContainer.remove();
                    alert('Không tìm thấy chữ nào.');
                } else {
                    alert('Không tìm thấy chữ nào.');
                    removeLoading();
                }
                return;
            }

            if (overlayContainer) {
                const statusEl = overlayContainer.querySelector('.tm-ocr-loading');
                if (statusEl) statusEl.textContent = 'Đang dịch...';
            } else {
                showLoading('Đang dịch văn bản (Quy trình chuẩn)...');
            }

            const cleanedText = ocrText.replace(/([^\x00-\xff])[^\S\r\n]+([^\x00-\xff])/g, '$1$2').trim();
            const returnType = config.nameEditingEnabled ? 'html' : 'text';
            const translatedText = await translatePanelText(cleanedText, returnType);

            if (!overlayContainer) removeLoading();

            if (config.ocrMode === 'overlay' && overlayContainer && screenRect) {
                updateOcrOverlayContent(overlayContainer, translatedText, screenRect);
            } else {
                if (overlayContainer) {
                    overlayContainer.remove();
                }
                showImageTranslationResult(translatedText, ocrText, base64FullString);
            }

        } catch (e) {
            console.error(e);
            if (!overlayContainer) removeLoading();
            if (overlayContainer) {
                overlayContainer.style.borderColor = 'red';
                overlayContainer.innerHTML = `<div style="padding:10px; color:red; font-size:12px;">Lỗi: ${e.message} <br><button onclick="this.parentElement.parentElement.remove()" style="margin-top:5px;">Đóng</button></div>`;
            } else {
                alert('Lỗi OCR: ' + e.message);
            }
        }
    }

    function createOcrOverlayPlaceholder(rect) {
        const overlayId = 'tm-ocr-overlay-' + Date.now();
        const container = document.createElement('div');
        container.id = overlayId;
        container.className = 'tm-ocr-overlay-box';

        const scrollX = window.scrollX || window.pageXOffset;
        const scrollY = window.scrollY || window.pageYOffset;

        Object.assign(container.style, {
            position: 'absolute',
            left: (rect.left + scrollX) + 'px',
            top: (rect.top + scrollY) + 'px',
            width: rect.width + 'px',
            height: rect.height + 'px',
            maxWidth: rect.width + 'px',
            maxHeight: rect.height + 'px',
            backgroundColor: 'rgba(255, 255, 255, 0.6)',
            border: '2px dashed #28a745',
            borderRadius: '4px',
            zIndex: '2147483648',
            boxSizing: 'border-box', // Quan trọng
            overflow: 'hidden',      // Không cho tràn
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: config.overrideFontFamily || 'Segoe UI, sans-serif'
        });

        container.innerHTML = `<div class="tm-ocr-loading" style="font-size:12px; color:#28a745; font-weight:bold; text-shadow: 1px 1px 2px white;">Đang chờ...</div>`;

        document.body.appendChild(container);
        return container;
    }

    function updateOcrOverlayContent(container, translatedHtml, rect) {
        if (!container) return;

        Object.assign(container.style, {
            backgroundColor: 'fff',
            border: '2px solid #28a745',
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            justifyContent: 'flex-start',
            height: 'auto',          // Reset height cứng lúc loading
            minHeight: rect.height + 'px',
            maxHeight: Math.max(rect.height, 400) + 'px', // Cho phép giãn tối đa 400px hoặc bằng box cũ
            overflow: 'visible' // Để hiện nút close (nút close absolute âm)
        });

        container.innerHTML = '';

        const closeBtn = document.createElement('div');
        closeBtn.innerHTML = '&times;';
        Object.assign(closeBtn.style, {
            position: 'absolute',
            top: '-15px',
            right: '-15px',
            width: '18px',
            height: '18px',
            backgroundColor: 'transparent',
            color: '#333',
            textAlign: 'center',
            lineHeight: '16px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '20px',
            zIndex: '30',
            userSelect: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textShadow: '0 0 3px #fff'
        });
        closeBtn.title = 'Đóng';
        closeBtn.onclick = () => container.remove();
        container.appendChild(closeBtn);

        const contentDiv = document.createElement('div');
        const textContent = translatedHtml.replace(/<br>/g, '\n').replace(/<\/?[^>]+(>|$)/g, "");
        contentDiv.innerHTML = translatedHtml.replace(/\n/g, '<br>');

        const area = rect.width * Math.max(rect.height, 50);
        const len = Math.max(textContent.length, 1);
        let scaleFactor = config.ocrTextScaleFactor || 1.8;
        let estimatedSize = Math.sqrt(area / (scaleFactor * len));

        const minSize = 10;
        const maxSize = Math.min(24, rect.width / 6);

        let finalSize = Math.min(Math.max(estimatedSize, minSize), maxSize);
        finalSize = Math.floor(finalSize);

        Object.assign(contentDiv.style, {
            padding: '4px', // Giảm padding tối đa
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            color: '#000',
            fontSize: finalSize + 'px',
            lineHeight: '1.3',
            textAlign: 'justify',
            flex: '1',
            overflowY: 'auto',
            overflowX: 'hidden',
            wordWrap: 'break-word',
            wordBreak: 'break-word',
            width: '100%', // Đảm bảo content không đẩy width cha
            boxSizing: 'border-box',
            userSelect: 'text',
            cursor: 'text',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            fontFamily: config.ocrFont || 'Noto Serif, serif'
        });
        container.appendChild(contentDiv);

        if (config.nameEditingEnabled) {
            contentDiv.addEventListener('mouseup', (e) => {
                setTimeout(() => {
                    const sel = window.getSelection();
                    if (sel && !sel.isCollapsed && contentDiv.contains(sel.anchorNode)) {
                        createFloatingEditBtn(e.clientX, e.clientY);
                    }
                }, 10);
            });
            contentDiv.addEventListener('click', (e) => {
                const nameSpan = e.target.closest('.tm-name');
                if (nameSpan) {
                    const orig = nameSpan.dataset.orig;
                    const text = nameSpan.textContent;
                    showEditModal(orig, text);
                    e.stopPropagation();
                }
            });

            let floatBtn = null;
            function createFloatingEditBtn(x, y) {
                if (floatBtn) floatBtn.remove();
                floatBtn = document.createElement('div');
                floatBtn.innerHTML = '🖊 Sửa';
                Object.assign(floatBtn.style, {
                    position: 'fixed', left: x + 10 + 'px', top: y - 30 + 'px',
                    background: '#333', color: '#fff', padding: '4px 8px', borderRadius: '4px',
                    cursor: 'pointer', zIndex: '2147483660', fontSize: '12px'
                });
                floatBtn.onmousedown = (evt) => {
                    evt.preventDefault();
                    openEditModalForSelection(); // Gọi hàm chuẩn
                    floatBtn.remove(); floatBtn = null;
                };
                document.body.appendChild(floatBtn);
                setTimeout(() => { if (floatBtn) floatBtn.remove(); }, 3000);
            }

            contentDiv.addEventListener('mousedown', () => {
                if (floatBtn) { floatBtn.remove(); floatBtn = null; }
            });
        }
    }

    function showImageTranslationResult(translatedHtml, originalText, imageUrl) {
        const modalId = 'tm-ocr-result-modal';
        removeElementById(modalId);

        const modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'tm-modal-wrapper';
        modal.style.zIndex = '2147483650';

        modal.innerHTML = `
        <div class="tm-modal-backdrop"></div>
        <div class="tm-modal-box" style="width: 700px; max-width: 95vw; height: 80vh; display: flex; flex-direction: column;">
            <div class="tm-modal-header">
                <h3>Kết quả Dịch Ảnh (OCR)</h3>
                <button id="tm-ocr-close" class="tm-btn">&times;</button>
            </div>
            <div class="tm-modal-content" style="display:flex; flex-direction:column; gap:15px; flex: 1; overflow-y: auto;">
                <div style="flex-shrink: 0;">
                    <span class="tm-label">Vùng đã chụp:</span>
                    <div style="max-height: 120px; overflow:hidden; border:1px solid #ddd; border-radius:4px; text-align:center; background:#eee;">
                        <img src="${imageUrl}" style="max-width:100%; max-height:120px; object-fit:contain;">
                    </div>
                </div>

                <div class="tm-row" style="flex: 1; min-height: 0;">
                     <div class="tm-col" style="height: 100%; display: flex; flex-direction: column;">
                        <span class="tm-label">Nhận diện (Trung):</span>
                        <textarea class="tm-textarea" style="flex: 1; resize: none;" readonly>${originalText}</textarea>
                    </div>
                    <div class="tm-col" style="height: 100%; display: flex; flex-direction: column;">
                        <span class="tm-label">Kết quả dịch (Việt):</span>
                        ${(translatedHtml.includes('<') && translatedHtml.includes('>'))
                ? `<div id="tm-ocr-output" class="tm-preview-box" style="flex: 1; height: 100%; overflow-y: auto; background: var(--tm-white); padding: 10px; border: 1px solid #ccc; white-space: pre-wrap;">${translatedHtml}</div>`
                : `<textarea id="tm-ocr-output" class="tm-textarea" style="flex: 1; resize: none;">${translatedHtml}</textarea>`
            }
                    </div>
                </div>
            </div>
            <div class="tm-modal-footer">
                <button class="tm-btn" id="tm-ocr-copy-orig">Copy Trung</button>
                <button class="tm-btn tm-btn-primary" id="tm-ocr-copy">Copy Dịch</button>
                <button class="tm-btn" id="tm-ocr-ok">Đóng</button>
            </div>
        </div>
    `;



        document.body.appendChild(modal);

        // Add Click Listener for Names in HTML Mode
        const outputBox = modal.querySelector('#tm-ocr-output');
        if (outputBox && outputBox.tagName === 'DIV') {
            outputBox.addEventListener('click', (e) => {
                const nameSpan = e.target.closest('.tm-name');
                if (nameSpan) {
                    const orig = nameSpan.dataset.orig;
                    const text = nameSpan.textContent;
                    showEditModal(orig, text);
                    e.stopPropagation();
                }
            });
            // Also support selection-based edit
            outputBox.addEventListener('mouseup', (e) => {
                const sel = window.getSelection();
                if (sel && !sel.isCollapsed && outputBox.contains(sel.anchorNode)) {
                    requestAnimationFrame(() => {
                        let floatBtn = document.getElementById('tm-ocr-float-edit');
                        if (floatBtn) floatBtn.remove();

                        floatBtn = document.createElement('div');
                        floatBtn.id = 'tm-ocr-float-edit';
                        floatBtn.innerHTML = '🖊 Sửa';
                        Object.assign(floatBtn.style, {
                            position: 'fixed', left: e.clientX + 10 + 'px', top: e.clientY - 30 + 'px',
                            background: '#007bff', color: '#fff', padding: '4px 8px', borderRadius: '4px',
                            cursor: 'pointer', zIndex: '2147483660', fontSize: '12px'
                        });
                        floatBtn.onmousedown = (evt) => {
                            evt.preventDefault();
                            openEditModalForSelection();
                            floatBtn.remove();
                        };
                        document.body.appendChild(floatBtn);
                        setTimeout(() => { if (floatBtn) floatBtn.remove(); }, 3000);
                    });
                }
            });
            outputBox.addEventListener('mousedown', () => {
                const b = document.getElementById('tm-ocr-float-edit');
                if (b) b.remove();
            });
        }

        const close = () => modal.remove();
        modal.querySelector('.tm-modal-backdrop').addEventListener('click', close);
        modal.querySelector('#tm-ocr-close').addEventListener('click', close);
        modal.querySelector('#tm-ocr-ok').addEventListener('click', close);

        modal.querySelector('#tm-ocr-copy-orig').addEventListener('click', () => {
            navigator.clipboard.writeText(originalText);
            showNotification('Đã copy văn bản gốc!');
        });

        modal.querySelector('#tm-ocr-copy').addEventListener('click', () => {
            const outputEl = modal.querySelector('#tm-ocr-output');
            const val = outputEl.value || outputEl.innerText;
            navigator.clipboard.writeText(val);
            showNotification('Đã copy văn bản dịch!');
        });
    }

    /* ================== INTERACTION HANDLERS ================== */

    async function handleOcrButtonClick() {
        const actionMode = config.ocrActionMode || 'region';
        const source = config.ocrImageSource || 'screen';

        if (actionMode === 'region') {
            await activateAreaSelectionMode();
        } else if (actionMode === 'image') {
            if (source === 'screen') {
                await handleOcrScreenMode();
            } else if (source === 'import') {
                await handleOcrImportMode();
            }
        }
    }

    async function grabFrameFromStream(track, stream) {
        try {
            const imageCapture = new ImageCapture(track);
            return await imageCapture.grabFrame();
        } catch (e) {
            // Firefox fallback: draw from video element
            const video = document.createElement('video');
            video.muted = true;
            video.srcObject = stream;
            video.playsInline = true;
            await video.play();
            await new Promise(r => setTimeout(r, 80));
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth || 1;
            canvas.height = video.videoHeight || 1;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0);
            video.pause();
            video.srcObject = null;
            const blob = await new Promise(res => canvas.toBlob(res));
            return await createImageBitmap(blob);
        }
    }

    async function handleOcrScreenMode() {
        showLoading('Đang lấy quyền chia sẻ màn hình...');
        try {
            // Need user interaction to get stream
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: { cursor: "never" },
                audio: false,
                preferCurrentTab: true
            });

            const track = stream.getVideoTracks()[0];

            // Hack cursor hide if possible (reusing logic or simplified)
            const styleId = 'tm-hide-cursor-style-scr';
            let styleTag = document.getElementById(styleId);
            if (!styleTag) {
                styleTag = document.createElement('style');
                styleTag.id = styleId;
                styleTag.innerHTML = '* { cursor: none !important; }';
                document.head.appendChild(styleTag);
            }
            await sleep(100);

            removeLoading(); // Avoid capturing loading UI into screenshot
            await sleep(80); // Wait a frame so the UI fully clears before capture
            const bitmap = await grabFrameFromStream(track, stream);

            if (styleTag) styleTag.remove();
            track.stop(); // Stop immediately after grab

            const canvas = document.createElement('canvas');
            canvas.width = bitmap.width;
            canvas.height = bitmap.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(bitmap, 0, 0);

            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

            showLoading('Đang nhận diện văn bản (Toàn màn hình)...');
            const captureViewport = {
                scrollX: window.scrollX,
                scrollY: window.scrollY,
                width: window.innerWidth,
                height: window.innerHeight
            };
            const result = await paddleService.recognize(dataUrl);

            removeLoading();
            renderScreenOverlay(result, canvas.width, canvas.height, captureViewport); // Map OCR boxes to captured viewport
            // Note: getDisplayMedia returns physical pixels. Window scroll is CSS pixels. DevicePixelRatio matters.

        } catch (e) {
            console.error(e);
            removeLoading();
            alert("Lỗi chụp màn hình: " + e.message);
        }
    }

    async function handleOcrImportMode() {
        // Create a modal to ask for File, URL or Paste
        const modalId = 'tm-ocr-import-modal';
        if (document.getElementById(modalId)) return;

        const modal = document.createElement('div');
        modal.id = modalId;
        Object.assign(modal.style, {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: '100000',
            display: 'flex', justifyContent: 'center', alignItems: 'center'
        });

        modal.innerHTML = `
            <div style="background:white; padding:20px; border-radius:8px; width:400px; text-align:center; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h3 style="margin-top:0; color:#333;">Nhập ảnh để dịch</h3>
                <div style="margin: 20px 0;">
                    <button id="tm-ocr-btn-file" class="tm-btn" style="width:100%; margin-bottom:10px;">📂 Chọn File Ảnh</button>
                    <button id="tm-ocr-btn-url" class="tm-btn" style="width:100%; margin-bottom:10px; background:#17a2b8;">🔗 Dán URL Ảnh</button>
                    <button id="tm-ocr-btn-paste" class="tm-btn" style="width:100%; background:#ffc107; color:#000;">📋 Dán từ Clipboard (Ctrl+V)</button>
                </div>
                <button id="tm-ocr-btn-cancel" class="tm-btn" style="background:#6c757d;">Hủy</button>
                <input type="file" id="tm-ocr-file-input" accept="image/*" style="display:none">
            </div>
         `;

        const close = () => modal.remove();
        modal.querySelector('#tm-ocr-btn-cancel').onclick = close;
        modal.onclick = (e) => { if (e.target === modal) close(); };

        // File
        const fileInput = modal.querySelector('#tm-ocr-file-input');
        modal.querySelector('#tm-ocr-btn-file').onclick = () => fileInput.click();
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                close();
                processImageForOcr(file);
            }
        };

        // URL
        modal.querySelector('#tm-ocr-btn-url').onclick = async () => {
            const url = prompt("Nhập URL ảnh:");
            if (url) {
                close();
                // Load URL to base64/blob
                try {
                    showLoading("Đang tải ảnh...");
                    const resp = await fetch(url);
                    const blob = await resp.blob();
                    processImageForOcr(blob);
                } catch (e) {
                    removeLoading();
                    alert("Không tải được ảnh từ URL này.");
                }
            }
        };

        // Paste (Pseudo-listener on window or button)
        // Better: Just listen to paste on the modal? OR the button triggers a "listening mode"?
        // Let's attach paste listener to window while modal is open.
        const pasteHandler = (e) => {
            const items = (e.clipboardData || e.originalEvent.clipboardData).items;
            for (const item of items) {
                if (item.type.indexOf("image") === 0) {
                    const blob = item.getAsFile();
                    e.preventDefault();
                    document.removeEventListener('paste', pasteHandler);
                    close();
                    processImageForOcr(blob);
                    return;
                }
            }
        };
        document.addEventListener('paste', pasteHandler);
        modal.querySelector('#tm-ocr-btn-paste').onclick = () => {
            alert("Hãy nhấn Ctrl+V ngay bây giờ để dán ảnh!");
        };

        // Cleanup listener on close
        const originalClose = close;
        modal.querySelector('#tm-ocr-btn-cancel').onclick = () => { document.removeEventListener('paste', pasteHandler); originalClose(); };

        document.body.appendChild(modal);
    }

    async function processImageForOcr(blobKey) {
        // Convert blob to base64
        const reader = new FileReader();
        reader.onload = async () => {
            const dataUrl = reader.result;

            // Create an Image object to get dimensions for Popup
            const img = new Image();
            img.onload = async () => {
                showLoading("Đang nhận diện văn bản...");
                try {
                    const result = await paddleService.recognize(dataUrl);
                    removeLoading();
                    renderSplitViewPopup(img, result);
                } catch (e) {
                    removeLoading();
                    alert("Lỗi OCR: " + e.message);
                }
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(blobKey);
    }

    // --- Render Functions (Placeholder for next step) ---
    function mergeNearbyBlocks(blocks) {
        if (!blocks || blocks.length === 0) return [];
        const rects = blocks.map((b) => {
            const xs = b.box.map(p => p[0]);
            const ys = b.box.map(p => p[1]);
            const l = Math.min(...xs);
            const r = Math.max(...xs);
            const t = Math.min(...ys);
            const btm = Math.max(...ys);
            return {
                block: b,
                l,
                r,
                t,
                b: btm,
                w: Math.max(1, r - l),
                h: Math.max(1, btm - t)
            };
        });

        rects.sort((a, b) => (a.t - b.t) || (a.l - b.l));

        const xOverlapRatio = (a, b) => {
            const overlap = Math.max(0, Math.min(a.r, b.r) - Math.max(a.l, b.l));
            return overlap / Math.max(1, Math.min(a.w, b.w));
        };

        const gaps = [];
        for (let i = 0; i < rects.length - 1; i++) {
            const gapY = Math.max(0, rects[i + 1].t - rects[i].b);
            gaps.push(gapY);
        }
        const maxAdjacentGap = gaps.length ? Math.max(...gaps) : 0;
        const threshold = maxAdjacentGap * 0.9;

        const groups = [];
        let current = [rects[0]];
        for (let i = 0; i < rects.length - 1; i++) {
            const cur = rects[i];
            const next = rects[i + 1];
            const gapY = Math.max(0, next.t - cur.b);
            const overlapX = xOverlapRatio(cur, next);

            if (gapY <= threshold && overlapX >= 0.2) {
                current.push(next);
            } else {
                groups.push(current);
                current = [next];
            }
        }
        if (current.length) groups.push(current);

        return groups.map((members) => {
            const texts = members
                .map(m => (m.block.text || '').replace(/\s+/g, ' ').trim())
                .filter(Boolean);
            const allPoints = members.flatMap(m => m.block.box);
            const xs = allPoints.map(p => p[0]);
            const ys = allPoints.map(p => p[1]);
            const mergedBox = [
                [Math.min(...xs), Math.min(...ys)],
                [Math.max(...xs), Math.min(...ys)],
                [Math.max(...xs), Math.max(...ys)],
                [Math.min(...xs), Math.max(...ys)]
            ];
            return {
                text: texts.join(' ').replace(/\s+/g, ' ').trim(),
                box: mergedBox
            };
        });
    }

    async function renderScreenOverlay(ocrResult, imgW, imgH, viewport) {
        // 1. Data Cleaning
        let blocks = [];
        const raw = ocrResult.raw || ocrResult;

        // Normalize structure
        if (Array.isArray(raw)) {
            blocks = raw;
        } else if (raw && raw.src && Array.isArray(raw.src)) {
            blocks = raw.src;
        } else if (raw && raw.data && raw.data.text) {
            // Maybe single block?
        }

        if (blocks.length === 0) {
            alert("Không tìm thấy văn bản nào!");
            return;
        }

        // 2. Container
        const containerId = 'tm-screen-overlay-wrapper';
        let container = document.getElementById(containerId);
        if (container) container.remove();

        const view = viewport || {
            scrollX: window.scrollX,
            scrollY: window.scrollY,
            width: window.innerWidth,
            height: window.innerHeight
        };

        container = document.createElement('div');
        container.id = containerId;
        Object.assign(container.style, {
            position: 'absolute',
            left: view.scrollX + 'px',
            top: view.scrollY + 'px',
            width: view.width + 'px',
            height: view.height + 'px',
            pointerEvents: 'none',
            zIndex: '2000000'
        });
        document.body.appendChild(container);

        // Close Button (Fixed on Screen)
        const closeBtn = document.createElement('div');
        closeBtn.innerHTML = "❌ Đóng Overlay";
        Object.assign(closeBtn.style, {
            position: 'absolute', top: '20px', right: '20px',
            backgroundColor: '#dc3545', color: 'white', padding: '10px 20px',
            borderRadius: '5px', cursor: 'pointer', pointerEvents: 'auto',
            zIndex: '2000001', fontWeight: 'bold', boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
        });
        closeBtn.onclick = () => container.remove();
        container.appendChild(closeBtn);

        const mergedBlocks = mergeNearbyBlocks(blocks);
        // 3. Process Blocks
        const scaleX = view.width / imgW;
        const scaleY = view.height / imgH;

        const measureCtx = document.createElement('canvas').getContext('2d');
        const fitTextToBox = (text, width, height, fontFamily) => {
            const minSize = 8;
            const maxByHeight = Math.max(9, Math.floor(height * 0.35));
            const maxByWidth = Math.max(9, Math.floor(width / 14));
            const maxSize = Math.min(18, maxByHeight, maxByWidth);
            const padding = 4;
            const maxW = Math.max(1, width - padding);
            const maxH = Math.max(1, height - padding);

            const wrapLines = (t, fontSize) => {
                measureCtx.font = `${fontSize}px ${fontFamily}`;
                const words = t.split(/\s+/).filter(Boolean);
                if (words.length === 0) return [''];
                const lines = [];
                let line = '';
                for (const word of words) {
                    const testLine = line ? `${line} ${word}` : word;
                    if (measureCtx.measureText(testLine).width <= maxW) {
                        line = testLine;
                        continue;
                    }
                    if (line) lines.push(line);
                    if (measureCtx.measureText(word).width > maxW) {
                        let chunk = '';
                        for (const ch of word) {
                            const testChunk = chunk + ch;
                            if (measureCtx.measureText(testChunk).width > maxW) {
                                if (chunk) lines.push(chunk);
                                chunk = ch;
                            } else {
                                chunk = testChunk;
                            }
                        }
                        if (chunk) lines.push(chunk);
                        line = '';
                    } else {
                        line = word;
                    }
                }
                if (line) lines.push(line);
                return lines;
            };

            let bestSize = minSize;
            let low = minSize;
            let high = maxSize;
            while (low <= high) {
                const mid = Math.floor((low + high) / 2);
                const lines = wrapLines(text, mid);
                const lineHeight = mid * 1.2;
                const totalH = lines.length * lineHeight;
                if (totalH <= maxH) {
                    bestSize = mid;
                    low = mid + 1;
                } else {
                    high = mid - 1;
                }
            }
            return bestSize;
        };

        const applyTextToBox = (box, text, width, height) => {
            const fontFamily = config.ocrFont || 'Noto Serif, serif';
            const size = fitTextToBox(text, width, height, fontFamily);
            box.style.fontFamily = fontFamily;
            box.style.fontSize = size + 'px';
            box.style.lineHeight = '1.2';
            box.textContent = text;
        };

        // Batch Translate
        const textsToTranslate = mergedBlocks.map(b => b.text);
        // FIXME: batch translate function needed. For now parallel single calls.
        // Or if translatePanelText supports batch? It does string only.
        // We will loop.

        for (const block of mergedBlocks) {
            if (!block.box || !block.text) continue;

            // Calculate Rect from 4 points [[x,y]...]
            const xs = block.box.map(p => p[0]);
            const ys = block.box.map(p => p[1]);
            const l = Math.min(...xs);
            const t = Math.min(...ys);
            const w = Math.max(...xs) - l;
            const h = Math.max(...ys) - t;

            const boxDiv = document.createElement('div');
            Object.assign(boxDiv.style, {
                position: 'absolute',
                left: (l * scaleX) + 'px',
                top: (t * scaleY) + 'px',
                width: (w * scaleX) + 'px',
                height: (h * scaleY) + 'px',
                backgroundColor: 'rgba(255, 255, 255, 0.85)',
                border: '1px solid #17a2b8',
                color: '#000',
                padding: '2px',
                boxSizing: 'border-box',
                overflow: 'hidden',
                pointerEvents: 'auto',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                textAlign: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            });
            boxDiv.title = "Gốc: " + block.text;
            boxDiv.textContent = '...';

            container.appendChild(boxDiv);

            // Translate individually (async)
            translatePanelText(block.text, 'text').then(res => {
                applyTextToBox(boxDiv, res, w * scaleX, h * scaleY);
            });
        }
    }
    async function renderSplitViewPopup(imgObj, ocrResult) {
        // 1. Data Cleaning
        let blocks = [];
        const raw = ocrResult.raw || ocrResult;
        if (Array.isArray(raw)) blocks = raw;
        else if (raw && raw.src && Array.isArray(raw.src)) blocks = raw.src;

        if (blocks.length === 0) {
            alert("Không tìm thấy văn bản nào trong ảnh!");
            return;
        }

        const mergedBlocks = mergeNearbyBlocks(blocks);

        // 2. UI Setup
        const modalId = 'tm-ocr-split-view';
        if (document.getElementById(modalId)) document.getElementById(modalId).remove();

        const modal = document.createElement('div');
        modal.id = modalId;
        Object.assign(modal.style, {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            backgroundColor: '#222', zIndex: '2000000',
            display: 'flex', flexDirection: 'column'
        });

        // Header
        const header = document.createElement('div');
        Object.assign(header.style, {
            height: '40px', backgroundColor: '#333', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px'
        });
        header.innerHTML = `<span><b>TM OCR Split View</b> - ${mergedBlocks.length} vùng văn bản</span>`;

        const closeBtn = document.createElement('button');
        closeBtn.textContent = "Đóng";
        Object.assign(closeBtn.style, { padding: '5px 15px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' });
        closeBtn.onclick = () => modal.remove();
        header.appendChild(closeBtn);
        modal.appendChild(header);

        // Content Area
        const content = document.createElement('div');
        Object.assign(content.style, {
            flex: '1', display: 'flex', overflow: 'hidden'
        });
        modal.appendChild(content);

        // Panes
        const createPane = (title) => {
            const wrapper = document.createElement('div');
            Object.assign(wrapper.style, {
                flex: '1', display: 'flex', flexDirection: 'column',
                borderRight: '1px solid #444', overflow: 'hidden', position: 'relative'
            });
            const head = document.createElement('div');
            head.textContent = title;
            Object.assign(head.style, {
                background: '#444', color: '#ccc', padding: '5px', textAlign: 'center', fontSize: '12px'
            });
            wrapper.appendChild(head);
            const scrollArea = document.createElement('div');
            Object.assign(scrollArea.style, {
                flex: '1', overflow: 'auto', backgroundColor: '#555', display: 'flex', justifyContent: 'center', alignItems: 'start', padding: '10px'
            });
            wrapper.appendChild(scrollArea);
            return { wrapper, scrollArea };
        };

        const leftPane = createPane("Ảnh Gốc + Vùng Nhận Diện");
        const rightPane = createPane("Kết Quả Dịch (Đè Ảnh)");
        content.appendChild(leftPane.wrapper);
        content.appendChild(rightPane.wrapper);

        // Canvases
        const createSyncedCanvas = () => {
            const c = document.createElement('canvas');
            c.width = imgObj.width;
            c.height = imgObj.height;
            c.style.display = 'block';
            // Draw Initial Image
            const ctx = c.getContext('2d');
            ctx.drawImage(imgObj, 0, 0);
            return c;
        };

        const createStage = () => {
            const stage = document.createElement('div');
            Object.assign(stage.style, {
                position: 'relative',
                width: imgObj.width + 'px',
                height: imgObj.height + 'px',
                flex: '0 0 auto'
            });
            const canvas = createSyncedCanvas();
            const overlay = document.createElement('div');
            Object.assign(overlay.style, {
                position: 'absolute',
                inset: '0',
                pointerEvents: 'auto',
                userSelect: 'text'
            });
            stage.appendChild(canvas);
            stage.appendChild(overlay);
            return { stage, canvas, overlay };
        };

        const leftStage = createStage();
        const rightStage = createStage();
        leftPane.scrollArea.appendChild(leftStage.stage);
        rightPane.scrollArea.appendChild(rightStage.stage);

        // Sync Scroll (Simple version)
        const sL = leftPane.scrollArea;
        const sR = rightPane.scrollArea;
        let isSyncingLeft = false;
        let isSyncingRight = false;

        sL.onscroll = () => {
            if (!isSyncingLeft) {
                isSyncingRight = true;
                sR.scrollTop = sL.scrollTop;
                sR.scrollLeft = sL.scrollLeft;
            }
            isSyncingLeft = false;
        };
        sR.onscroll = () => {
            if (!isSyncingRight) {
                isSyncingLeft = true;
                sL.scrollTop = sR.scrollTop;
                sL.scrollLeft = sR.scrollLeft;
            }
            isSyncingRight = false;
        };

        document.body.appendChild(modal);

        // 3. Draw Left (Chinese Boxes)
        const ctxL = leftStage.canvas.getContext('2d');
        const baseCanvas = document.createElement('canvas');
        baseCanvas.width = imgObj.width;
        baseCanvas.height = imgObj.height;
        const baseCtx = baseCanvas.getContext('2d');
        baseCtx.drawImage(imgObj, 0, 0);
        ctxL.strokeStyle = 'red';
        ctxL.lineWidth = 2;
        ctxL.font = '12px Arial';
        ctxL.fillStyle = 'red'; // For text number or debug

        for (const block of mergedBlocks) {
            if (!block.box) continue;
            // Draw box
            ctxL.beginPath();
            ctxL.moveTo(block.box[0][0], block.box[0][1]);
            for (let i = 1; i < block.box.length; i++) ctxL.lineTo(block.box[i][0], block.box[i][1]);
            ctxL.closePath();
            ctxL.stroke();
        }

        // 4. Draw Right (Translation)
        // Helper to get rect
        const getRect = (box) => {
            const xs = box.map(p => p[0]);
            const ys = box.map(p => p[1]);
            const l = Math.min(...xs);
            const t = Math.min(...ys);
            const w = Math.max(...xs) - l;
            const h = Math.max(...ys) - t;
            return { l, t, w, h };
        };

        const getAverageColor = (ctx, rect) => {
            const maxSample = 64;
            const padding = 8;
            const outerL = Math.max(0, Math.floor(rect.l - padding));
            const outerT = Math.max(0, Math.floor(rect.t - padding));
            const outerR = Math.min(ctx.canvas.width, Math.ceil(rect.l + rect.w + padding));
            const outerB = Math.min(ctx.canvas.height, Math.ceil(rect.t + rect.h + padding));
            const innerL = Math.max(0, Math.floor(rect.l));
            const innerT = Math.max(0, Math.floor(rect.t));
            const innerR = Math.min(ctx.canvas.width, Math.ceil(rect.l + rect.w));
            const innerB = Math.min(ctx.canvas.height, Math.ceil(rect.t + rect.h));
            const sw = Math.max(1, outerR - outerL);
            const sh = Math.max(1, outerB - outerT);
            const sampleW = Math.min(sw, maxSample);
            const sampleH = Math.min(sh, maxSample);
            const stepX = Math.max(1, Math.floor(sw / sampleW));
            const stepY = Math.max(1, Math.floor(sh / sampleH));
            const data = ctx.getImageData(outerL, outerT, sw, sh).data;

            let r = 0, g = 0, b = 0, count = 0;
            for (let y = 0; y < sh; y += stepY) {
                for (let x = 0; x < sw; x += stepX) {
                    const px = outerL + x;
                    const py = outerT + y;
                    if (px >= innerL && px <= innerR && py >= innerT && py <= innerB) {
                        continue;
                    }
                    const idx = (y * sw + x) * 4;
                    r += data[idx];
                    g += data[idx + 1];
                    b += data[idx + 2];
                    count++;
                }
            }
            if (!count) return { r: 255, g: 255, b: 255 };
            return { r: Math.round(r / count), g: Math.round(g / count), b: Math.round(b / count) };
        };

        const getTextColor = (rgb) => {
            const luminance = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
            return luminance > 0.6 ? '#111' : '#f8f8f8';
        };

        const measureCtx = document.createElement('canvas').getContext('2d');
        const fitTextToBox = (text, width, height, fontFamily) => {
            const minSize = 8;
            const maxByHeight = Math.max(9, Math.floor(height * 0.3));
            const maxByWidth = Math.max(9, Math.floor(width / 14));
            const charCount = Math.max(1, text.length);
            const maxByChars = Math.max(9, Math.floor(Math.sqrt((width * height) / charCount) * 0.7));
            const maxSize = Math.min(16, maxByHeight, maxByWidth, maxByChars);
            const padding = 4;
            const maxW = Math.max(1, width - padding);
            const maxH = Math.max(1, height - padding);

            const wrapLines = (t, fontSize) => {
                measureCtx.font = `${fontSize}px ${fontFamily}`;
                const words = t.split(/\s+/).filter(Boolean);
                if (words.length === 0) return [''];
                const lines = [];
                let line = '';
                for (const word of words) {
                    const testLine = line ? `${line} ${word}` : word;
                    if (measureCtx.measureText(testLine).width <= maxW) {
                        line = testLine;
                        continue;
                    }
                    if (line) lines.push(line);
                    if (measureCtx.measureText(word).width > maxW) {
                        let chunk = '';
                        for (const ch of word) {
                            const testChunk = chunk + ch;
                            if (measureCtx.measureText(testChunk).width > maxW) {
                                if (chunk) lines.push(chunk);
                                chunk = ch;
                            } else {
                                chunk = testChunk;
                            }
                        }
                        if (chunk) lines.push(chunk);
                        line = '';
                    } else {
                        line = word;
                    }
                }
                if (line) lines.push(line);
                return lines;
            };

            let bestSize = minSize;
            let low = minSize;
            let high = maxSize;
            while (low <= high) {
                const mid = Math.floor((low + high) / 2);
                const lines = wrapLines(text, mid);
                const lineHeight = mid * 1.15;
                const totalH = lines.length * lineHeight;
                if (totalH <= maxH) {
                    bestSize = mid;
                    low = mid + 1;
                } else {
                    high = mid - 1;
                }
            }
            return bestSize;
        };

        const applyFitTextToOverlay = (el, text, rect) => {
            const fontFamily = config.ocrFont || 'Noto Serif, serif';
            const size = Math.min(Math.floor(fitTextToBox(text, rect.w, rect.h, fontFamily) * 1.5), rect.h);
            el.style.fontFamily = fontFamily;
            el.style.fontSize = size + 'px';
            el.style.lineHeight = '1.15';
            el.textContent = text;
        };

        const createTextOverlayBlock = (text, rect, options = {}) => {
            const div = document.createElement('div');
            Object.assign(div.style, {
                position: 'absolute',
                left: rect.l + 'px',
                top: rect.t + 'px',
                width: rect.w + 'px',
                height: rect.h + 'px',
                padding: '2px',
                boxSizing: 'border-box',
                background: options.background || 'rgba(255,255,255,0.6)',
                border: options.border || '1px solid rgba(0,0,0,0.2)',
                color: options.color || '#000',
                fontFamily: config.ocrFont || 'Noto Serif',
                fontSize: '12px',
                lineHeight: '1.15',
                whiteSpace: 'pre-wrap',
                overflow: 'hidden',
                pointerEvents: 'auto',
                userSelect: 'text'
            });
            div.textContent = text;
            return div;
        };

        // Translate and Draw Loop
        for (const block of mergedBlocks) {
            if (!block.box || !block.text) continue;
            const { l, t, w, h } = getRect(block.box);

            const rect = { l, t, w, h };
            const avgColor = getAverageColor(baseCtx, rect);
            const textColor = getTextColor(avgColor);
            const bgColor = `rgba(${avgColor.r}, ${avgColor.g}, ${avgColor.b}, 0.95)`;
            const leftTextBox = createTextOverlayBlock(block.text, rect, {
                background: bgColor,
                border: '1px solid rgba(255,0,0,0.55)',
                color: textColor
            });
            leftStage.overlay.appendChild(leftTextBox);
            applyFitTextToOverlay(leftTextBox, block.text, rect);

            const rightTextBox = createTextOverlayBlock('...', rect, {
                background: bgColor,
                border: '1px solid rgba(0,0,0,0.25)',
                color: textColor
            });
            rightStage.overlay.appendChild(rightTextBox);

            // Async Translate
            translatePanelText(block.text, 'text').then(translated => {
                applyFitTextToOverlay(rightTextBox, translated, rect);
            });
        }
    }

    async function activateAreaSelectionMode() {
        showNotification('Chế độ OCR: Kéo chuột để chọn vùng cần dịch. (Nhấn Esc để hủy)', 4000);

        let overlay = document.createElement('div');
        Object.assign(overlay.style, {
            position: 'fixed', inset: '0', zIndex: '2147483646',
            cursor: 'crosshair', background: 'rgba(0,0,0,0.1)'
        });

        let selectionBox = document.createElement('div');
        Object.assign(selectionBox.style, {
            position: 'fixed', border: '2px dashed red', background: 'rgba(255, 0, 0, 0.1)',
            display: 'none', zIndex: '2147483647', pointerEvents: 'none'
        });

        document.body.appendChild(overlay);
        document.body.appendChild(selectionBox);

        let startX, startY, endX, endY, isDragging = false;

        function onMouseDown(e) {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            selectionBox.style.left = startX + 'px';
            selectionBox.style.top = startY + 'px';
            selectionBox.style.width = '0px';
            selectionBox.style.height = '0px';
            selectionBox.style.display = 'block';
        }

        function onMouseMove(e) {
            if (!isDragging) return;
            endX = e.clientX;
            endY = e.clientY;

            const left = Math.min(startX, endX);
            const top = Math.min(startY, endY);
            const width = Math.abs(endX - startX);
            const height = Math.abs(endY - startY);

            selectionBox.style.left = left + 'px';
            selectionBox.style.top = top + 'px';
            selectionBox.style.width = width + 'px';
            selectionBox.style.height = height + 'px';

        }

        window.__tmIsCapturing = false;

        async function captureVisibleTab(rect) {
            if (window.__tmIsCapturing) {
                console.log("Đang có tiến trình chụp khác chạy, bỏ qua.");
                return null;
            }
            window.__tmIsCapturing = true;

            let stream = window.__tmCachedStream;

            if (stream) {
                try {
                    if (!stream.active || stream.getVideoTracks()[0].readyState === 'ended') {
                        console.log("Stream cũ đã chết, reset.");
                        stream = null;
                        window.__tmCachedStream = null;
                    }
                } catch (e) { stream = null; }
            }

            try {
                if (!stream) {
                    stream = await navigator.mediaDevices.getDisplayMedia({
                        video: {
                            displaySurface: "browser",
                            cursor: "never"
                        },
                        audio: false,
                        preferCurrentTab: true
                    });

                    window.__tmCachedStream = stream;

                    stream.getVideoTracks()[0].addEventListener('ended', () => {
                        window.__tmCachedStream = null;
                        console.log("[TM-Translate] Stream chia sẻ đã bị tắt thủ công.");
                    });
                }

                const track = stream.getVideoTracks()[0];

                const styleId = 'tm-hide-cursor-style';
                let styleTag = document.getElementById(styleId);
                if (!styleTag) {
                    styleTag = document.createElement('style');
                    styleTag.id = styleId;
                    styleTag.innerHTML = '* { cursor: none !important; }';
                    document.head.appendChild(styleTag);
                }

                await sleep(100); // Wait for browser repaint
                const bitmap = await grabFrameFromStream(track, stream);

                if (styleTag) styleTag.remove(); // Restore cursor

                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                const zoomX = bitmap.width / window.innerWidth;
                const zoomY = bitmap.height / window.innerHeight;

                const cropX = rect.left * zoomX;
                const cropY = rect.top * zoomY;
                const cropW = rect.width * zoomX;
                const cropH = rect.height * zoomY;

                const scaleFactor = 2; // Upscale 2x

                canvas.width = cropW * scaleFactor;
                canvas.height = cropH * scaleFactor;

                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';

                ctx.drawImage(bitmap, cropX, cropY, cropW, cropH, 0, 0, cropW * scaleFactor, cropH * scaleFactor);

                window.__tmIsCapturing = false;
                return canvas.toDataURL('image/jpeg', 0.95);

            } catch (err) {
                window.__tmIsCapturing = false;
                if (!window.__tmCachedStream && stream) {
                    stream.getTracks().forEach(t => t.stop());
                }
                console.error(err);
                if (err.name === 'NotAllowedError') { // User bấm Cancel
                    throw new Error("Bạn đã hủy lệnh chụp. Hãy thử lại.");
                }
                throw new Error("Lỗi chụp màn hình: " + err.message);
            }
        }

        async function onMouseUp(e) {
            if (!isDragging) return;
            isDragging = false;

            const rect = selectionBox.getBoundingClientRect();
            cleanup(); // Xóa UI ngay lập tức

            if (rect.width < 10 || rect.height < 10) {
                showNotification('Vùng chọn quá nhỏ, đã hủy.');
                return;
            }

            removeLoading();

            if (!window.__tmCachedStream) {
                showNotification('⚠ Vui lòng chọn "Tab này" và nhấn Cho phép!', 4000);
            }

            try {
                const base64Image = await captureVisibleTab(rect);
                if (base64Image) {
                    // Nếu mode là overlay thì tạo placeholder ngay
                    let placeholderBox = null;
                    if (config.ocrMode === 'overlay') {
                        placeholderBox = createOcrOverlayPlaceholder(rect);
                    } else {
                        showLoading('Đang nhận diện văn bản...');
                    }

                    handleOcrRequest(base64Image, 'data:image/jpeg;base64,', placeholderBox, rect);
                }
            } catch (err) {
                showNotification(err.message);
            }
        }

        function onKeyDown(e) {
            if (e.key === 'Escape') {
                cleanup();
                showNotification('Đã hủy OCR.');
            }
        }

        function cleanup() {
            if (overlay) { overlay.remove(); overlay = null; }
            if (selectionBox) { selectionBox.remove(); selectionBox = null; }
            // document.removeEventListener('mousedown', onMouseDown);
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            document.removeEventListener('keydown', onKeyDown);
            // Reset các biến cờ local
            isDragging = false;
        }

        overlay.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        document.addEventListener('keydown', onKeyDown);
    }

    /* ================== MENU & INIT ================== */

    async function initializeLocalTranslator() {
        if (config.translationMode !== 'local' || (window.TranslateZhToVi && window.TranslateZhToVi.isReady)) {
            return;
        }
        try {
            showLoading('Đang tải từ điển local...');
            await window.TranslateZhToVi.init({
                nameUrl: 'https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/translate/zh_to_vi/Name.json',
                vpUrl: 'https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/translate/zh_to_vi/VP.json',
                hvUrl: 'https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/translate/zh_to_vi/HanViet.json'
            });
            console.log('[tm-translate] Thư viện dịch local đã sẵn sàng.');
        } catch (err) {
            console.error('[tm-translate] Lỗi khởi tạo thư viện dịch local:', err);
            alert('Không thể tải từ điển local. Vui lòng kiểm tra kết nối mạng và thử lại.');
            config.translationMode = 'server';
        } finally {
            removeLoading();
        }
    }

    if (checkBlacklistStatus()) {
        console.log('[tm-translate] Trang này nằm trong Blacklist. Script đã dừng hoạt động.');

        injectGlobalCSS();

        GM_registerMenuCommand('🚫 Mở Cài đặt (Bỏ chặn)', () => {
            openSettingsUI();
            setTimeout(() => {
                const blTab = document.querySelector('[data-tab="blacklist"]');
                if (blTab) blTab.click();
            }, 50);
        });

        return;
    }

    GM_registerMenuCommand('Dịch trang này', startTranslateAction);
    GM_registerMenuCommand('Bảng dịch nhanh', showQuickTranslatePanel);
    GM_registerMenuCommand('Dịch vùng chọn (OCR)', activateAreaSelectionMode);
    GM_registerMenuCommand('Cài đặt', openSettingsUI);

    window._tm_translate = {
        start: startTranslateAction,
        settings: openSettingsUI,
        retranslateKey: applyChangesAndRetranslate,
        toggleSimplified: () => simplifiedActive ? disableSimplifiedView() : enableSimplifiedView(),
        getState: () => lastTranslationState,
        getConfig: () => config,
    };

    injectGlobalCSS();
    updateFloatingButtons();

    if (config.translationMode === 'local') {
        initializeLocalTranslator();
    }

    console.log('[tm-translate 3.3.4_beta] Đã tải thành công.');

})();
