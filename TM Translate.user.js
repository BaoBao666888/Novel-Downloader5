// ==UserScript==
// @name         TM Translate
// @author       QuocBao
// @namespace    http://tampermonkey.net/
// @version      2.0.2
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
// @connect      raw.githubusercontent.com
// @connect      dichngay.com
// ==/UserScript==

(function() { 'use strict';

/* ================== DEFAULT CONFIG ================== */
const DEFAULT_CONFIG = {
    serverUrl: 'https://dichngay.com/translate/text',
    targetLang: 'vi',
    delayMs: 400,
    maxCharsPerRequest: 4500,
    includeScriptStyle: false,
    activeNameSet: 'Mặc định',
    nameSets: {
        'Mặc định': {
            '贺川': 'Hạ Xuyên',
            '崔然': 'Thôi Nhiên'
        }
    },
    hanvietJsonUrl: 'https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/han_viet/output.json',
    simplifiedEnabled: false,
    simplifiedBlockJS: true,
    simplifiedStyle: {
        fontFamily: "Noto Serif, 'Times New Roman', serif",
        fontSize: 21,
        lineHeight: 1.9,
        bgColor: '#fdfdf6',
        textColor: '#1f1f1f',
        textAlign: 'justify'
    }
};

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
    return merged;
}
function saveConfig(cfg) { GM_setValue('tm_translate_config_v2', cfg); }
let config = loadConfig();

/* ================== GLOBAL STATE ================== */
let lastTranslationState = null; // { items, placeholderMaps, translatedResults }
let hanvietMap = null;
let lastSelectionRange = null;
let simplifiedActive = false;
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


// Thêm hàm này vào khu vực UTILITIES
function injectGlobalCSS() {
    // Nếu style đã tồn tại, không làm gì cả để tránh trùng lặp
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
        .tm-modal-content { padding: 20px; overflow-y: auto; }
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
        .tm-preview-box { border: 1px solid var(--tm-border-color); padding: 8px; min-height: 200px; max-height: 400px; overflow: auto; background: #fafafa; border-radius: 6px; }
        #tm-loading-indicator { position: fixed; top: 10px; left: 50%; transform: translateX(-50%); background: var(--tm-dark); color: white; padding: 10px 20px; border-radius: 8px; z-index: 2147483647; font-size: 16px; box-shadow: var(--tm-shadow); }
    `;
    const styleEl = document.createElement('style');
    styleEl.id = 'tm-global-styles';
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
}
/* ================== DOM MANIPULATION & UI HELPERS ================== */
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
function showFloatingButtons() {
    removeFloatingButtons();
    const pencil = document.createElement('div');
    pencil.id = 'tm-edit-pencil';
    pencil.className = 'tm-float-btn';
    pencil.title = 'Sửa tên (chọn chữ rồi bấm)';
    pencil.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;

    pencil.addEventListener('mousedown', () => {
        const sel = window.getSelection();
        if (sel.rangeCount > 0) {
            lastSelectionRange = sel.getRangeAt(0).cloneRange();
        }
    });
    pencil.addEventListener('click', (event) => {
        event.preventDefault();
        openEditModalForSelection();
    });
    document.body.appendChild(pencil);

    // Chỉ hiển thị nút Style khi ở chế độ rút gọn
    if (simplifiedActive) {
        const styleBtn = document.createElement('div');
        styleBtn.id = 'tm-style-button';
        styleBtn.className = 'tm-float-btn';
        styleBtn.title = 'Tùy chỉnh Giao diện đọc';
        styleBtn.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18M5 7h14M5 17h14"/></svg>`;
        styleBtn.addEventListener('click', toggleStylePanel);
        document.body.appendChild(styleBtn);
    }
}
function removeFloatingButtons() {
    document.getElementById('tm-edit-pencil')?.remove();
    document.getElementById('tm-style-button')?.remove();
    removeStylePanel();
}
function removeElementById(id) { document.getElementById(id)?.remove(); }

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

// Delegated handler cho nút edit-style — paste vào cuối file
document.addEventListener('click', function delegatedEditStyle(e) {
  const btn = e.target.closest('.tm-edit-style-btn') || e.target.closest('#editStyleBtn') || e.target.closest('[data-tm-action="edit-style"]');
  if (!btn) return;

  e.preventDefault();
  e.stopPropagation();

  // restore selection nếu bị mất khi click
  try {
    const sel = window.getSelection();
    if ((!sel || sel.toString().trim().length === 0) && window._lastSelectionSnapshot) {
      const s2 = window.getSelection();
      s2.removeAllRanges();
      s2.addRange(window._lastSelectionSnapshot);
    }
  } catch (err) { /* ignore */ }

  // danh sách tên hàm có thể là handler chỉnh style trong script của bạn
  const candidateFns = [
    'openEditStyleModal',
    'openStyleModal',
    'openStyleEditor',
    'openEditModalForStyle',
    'openEditModalForSelection', // fallback nếu dùng chung
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
    // fallback: emit custom event để script khác lắng nghe (không gây lỗi)
    const ev = new CustomEvent('tm:edit-style-clicked', { detail: { button: btn } });
    document.dispatchEvent(ev);
    console.warn('Không tìm thấy hàm edit-style; phát event tm:edit-style-clicked để lắng nghe thay thế.');
  }
});

document.addEventListener('selectionchange', function saveSelectionSnapshot() {
  try {
    const s = window.getSelection();
    if (s && s.rangeCount) window._lastSelectionSnapshot = s.getRangeAt(0).cloneRange();
  } catch (e) {}
});


/* ================== CORE TRANSLATION LOGIC ================== */
function collectTranslatableItems(includeScriptStyle = false, roots = [document.body]) {
    const items = [];
    const seenNodes = new WeakSet();
    const skipTags = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'PRE', 'CODE', 'TEXTAREA'];
    const ignoreRootIds = ['tm-edit-pencil', 'tm-style-button', 'tm-edit-modal', 'tm-settings-modal', 'tm-style-panel'];

    // Regex MỚI: Chỉ lấy text có chứa ký tự chữ (Hán hoặc Latinh), bỏ qua các chuỗi chỉ có số và dấu câu.
    const hasMeaningfulTextRegex = /[a-zA-Z\u4e00-\u9fa5]/;

    function isIgnored(element) {
        if (!element || seenNodes.has(element)) return true;
        let cur = element;
        while (cur) {
            if (cur.nodeType !== 1) {
                cur = cur.parentElement;
                continue;
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

        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.nodeValue.trim();
            // Áp dụng điều kiện lọc MỚI
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
                // Áp dụng điều kiện lọc MỚI
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
    console.log(`[tm-translate] Đã thu thập được ${items.length} mục để dịch (đã lọc text có nghĩa).`);
    return items;
}
function buildNameSetReplacer(nameSet) {
    const keys = Object.keys(nameSet).sort((a, b) => b.length - a.length);
    return function(text, placeholderMap) {
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

function postTranslate(serverUrl, content, targetLang) {
    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: 'POST',
            url: serverUrl,
            headers: { 'Content-Type': 'application/json', 'referer': 'https://dichngay.com/' },
            data: JSON.stringify({ content, tl: targetLang }),
            onload(res) {
                if (res.status >= 200 && res.status < 300) {
                    try { resolve(JSON.parse(res.responseText)); } catch (e) { reject(new Error('Invalid JSON: ' + e)); }
                } else reject(new Error('HTTP ' + res.status));
            },
            onerror(err) { reject(err); }
        });
    });
}

async function startTranslateAction() {
    try {
        let isRetranslatingInSimplifiedMode = simplifiedActive;

        if (isRetranslatingInSimplifiedMode) {
            console.log("Đang dịch lại trong Chế độ rút gọn...");
        } else {
            originalBodyClone = document.body.cloneNode(true);
        }

        showLoading('Đang thu thập nội dung...');
        config = loadConfig();
        const nameSet = config.nameSets[config.activeNameSet] || {};
        const replacer = buildNameSetReplacer(nameSet);

        const items = collectTranslatableItems(config.includeScriptStyle, [originalBodyClone]);
        if (items.length === 0) {
            removeLoading();
            alert('[tm-translate] Không tìm thấy nội dung để dịch.');
            return;
        }

        const placeholderMaps = [];
        const modifiedContents = items.map(it => {
            const pmap = {};
            const after = replacer(it.original || '', pmap);
            placeholderMaps.push(pmap);
            return after;
        });

        lastTranslationState = { items, placeholderMaps, translatedResults: null };
        const batches = splitIntoBatches(modifiedContents, config.maxCharsPerRequest);
        showLoading(`Đang dịch... (0/${batches.length} gói)`);

        let translatedResults = [];
        for (let b = 0; b < batches.length; b++) {
            showLoading(`Đang dịch... (${b + 1}/${batches.length} gói)`);
            const batchArr = batches[b];
            try {
                const json = await postTranslate(config.serverUrl, batchArr.join('\n'), config.targetLang);
                const translatedRaw = json?.data?.content ?? json?.translatedText;
                if (typeof translatedRaw === 'string') {
                    translatedResults.push(...translatedRaw.split('\n'));
                } else {
                    throw new Error('Phản hồi dịch không hợp lệ');
                }
            } catch (error) {
                console.error(`[tm-translate] Lỗi khi dịch gói ${b + 1}:`, error);
                // *** FIX LỖI "LỘN CHỖ" QUAN TRỌNG NHẤT ***
                // Nếu dịch lỗi, chèn các chuỗi rỗng để giữ đúng thứ tự và độ dài mảng.
                const emptyResults = Array(batchArr.length).fill('');
                translatedResults.push(...emptyResults);
                alert(`Gặp lỗi khi dịch gói ${b + 1}. Một số đoạn có thể không được dịch. Vui lòng thử lại sau.`);
            }
            if (b < batches.length - 1) await sleep(config.delayMs);
        }

        lastTranslationState.translatedResults = translatedResults;
        showLoading('Đang áp dụng bản dịch...');

        translatedBodyClone = originalBodyClone.cloneNode(true);
        const itemsInClone = collectTranslatableItems(config.includeScriptStyle, [translatedBodyClone]);
        const restorePlaceholders = (text, pmap) => Object.entries(pmap).reduce((acc, [ph, data]) => acc.split(ph).join(data.viet), text);

        for (let i = 0; i < itemsInClone.length; i++) {
            const it = itemsInClone[i];
            const rawRes = translatedResults[i];
            if (rawRes == null || rawRes === '') continue; // Bỏ qua nếu không có bản dịch
            const finalPlainText = restorePlaceholders(rawRes, placeholderMaps[i] || {});
            if (it.type === 'text') it.node.nodeValue = finalPlainText;
            else if (it.type === 'attribute') it.element.setAttribute(it.attribute, finalPlainText);
        }

        if (!isRetranslatingInSimplifiedMode && !config.simplifiedEnabled) {
            document.body.replaceWith(translatedBodyClone.cloneNode(true));
        }

        removeLoading();
        console.log('[tm-translate] Dịch hoàn tất.');
        showFloatingButtons();

        if (config.simplifiedEnabled || isRetranslatingInSimplifiedMode) {
            enableSimplifiedView();
        }
        if (!simplifiedActive) {
            startAutoTranslateObserver();
        }

    } catch (err) {
        removeLoading();
        console.error('[tm-translate] Lỗi nghiêm trọng:', err);
        alert('Đã xảy ra lỗi nghiêm trọng trong quá trình dịch. Vui lòng kiểm tra console (F12).');
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
/* === Helpers for simplified view & safe spacing === */
function splitBySentenceHeuristic(text) {
  const regex = /([^。！？!?\.]+[。！？!?\.…]?)/g;
  const parts = text.match(regex);
  if (!parts) return [text];
  return parts.map(p => p.trim()).filter(Boolean);
}

function splitByLength(text, maxLen = 120) {
  const out = [];
  let s = (text||'').trim();
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

function buildSimplifiedHtml(mainContentElement) {
    // Hàm đệ quy để đi sâu vào cây DOM và xây dựng lại HTML một cách an toàn
    function processNode(node) {
        // 1. Xử lý node văn bản: trả về nội dung đã được escape
        if (node.nodeType === 3) { // Text Node
            return escapeHtml(node.nodeValue);
        }

        // 2. Bỏ qua các node không phải element (comment, etc.)
        if (node.nodeType !== 1) {
            return '';
        }

        const tagName = node.tagName.toUpperCase();

        // 3. Các thẻ cần loại bỏ hoàn toàn và không xử lý con của chúng
        const tagsToDiscard = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'FORM', 'BUTTON', 'INPUT', 'NAV', 'FOOTER', 'HEADER', 'ASIDE', 'IMG', 'VIDEO', 'SVG', 'CANVAS'];
        if (tagsToDiscard.includes(tagName)) {
            return '';
        }

        // 4. Thẻ ngắt dòng <br> là tín hiệu quan trọng để tách đoạn
        if (tagName === 'BR') {
            return ' <br> '; // Thêm khoảng trắng để đảm bảo tách biệt
        }

        // 5. Xử lý các node con trước để lấy nội dung bên trong
        let innerHtml = Array.from(node.childNodes).map(processNode).join('');

        // 6. Giữ lại các thẻ định dạng inline quan trọng
        const inlineTags = ['B', 'I', 'STRONG', 'EM', 'U', 'SPAN', 'FONT'];
        if (inlineTags.includes(tagName)) {
            // Chỉ giữ lại thẻ nếu nó thực sự chứa nội dung
            return innerHtml.trim() ? `<${tagName.toLowerCase()}>${innerHtml}</${tagName.toLowerCase()}>` : '';
        }

        // 7. Xử lý và giữ lại các thẻ link <a> hợp lệ
        if (tagName === 'A') {
            const href = node.getAttribute('href');
            if (href && (href.startsWith('http') || href.startsWith('/'))) {
                return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${innerHtml}</a>`;
            }
            // Nếu link không hợp lệ, chỉ trả về nội dung bên trong (flatten)
            return innerHtml;
        }

        // 8. Với các thẻ khối (div, p, li, table,...) và các thẻ khác,
        // chúng ta chỉ lấy nội dung bên trong và thêm dấu ngắt <br> để đảm bảo tách đoạn.
        // Điều này sẽ "ép phẳng" cấu trúc bảng mà vẫn giữ được thứ tự.
        if (innerHtml.trim()) {
             return ` <br>${innerHtml}<br> `;
        }
        return '';
    }

    // Bắt đầu xử lý từ khối nội dung chính
    const rawHtml = processNode(mainContentElement);

    // Dọn dẹp và tách chuỗi HTML thô thành các đoạn văn sạch sẽ
    const finalParagraphs = rawHtml
        .split(/<br\s*\/?>/i) // Tách các đoạn bằng thẻ <br>
        .map(p => p.replace(/&nbsp;/g, ' ').trim()) // Dọn dẹp khoảng trắng
        .filter(p => p.length > 0 && p.replace(/<[^>]+>/g, '').trim().length > 0); // Lọc bỏ các đoạn trống

    // Bọc mỗi đoạn trong thẻ <p> để đảm bảo hiển thị đúng
    return finalParagraphs.map(p => `<p>${p}</p>`).join('\n');
}

function enableSimplifiedView() {
    if (simplifiedActive) {
        applySimplifiedStyle(); // Chỉ cần áp dụng lại style nếu đã ở chế độ rút gọn
        return;
    }

    if (!translatedBodyClone) {
        alert("Chưa có nội dung dịch để hiển thị. Vui lòng dịch trang trước.");
        return;
    }

    const mainContentElement = findMainContentElement(translatedBodyClone);
    if (!mainContentElement) {
        alert("Không thể tìm thấy nội dung chính.");
        return;
    }

    const cleanContentHtml = buildSimplifiedHtml(mainContentElement);

    // *** LOGIC MỚI: DỌN DẸP HEAD THÔNG MINH ***
    // 1. Xóa các file style và script CỦA TRANG GỐC
    document.head.querySelectorAll('link[rel="stylesheet"], style, script').forEach(el => {
        // Giữ lại các thẻ của Tampermonkey hoặc của chính script này
        if (!el.src?.includes('tampermonkey') && !el.id.startsWith('tm-')) {
            el.remove();
        }
    });

    // 2. Cài lại CSS toàn cục của script để đảm bảo giao diện không bị hỏng
    injectGlobalCSS();

    // 3. Tạo lại trang rút gọn
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
    showFloatingButtons();
}

function applySimplifiedStyle() {
    const s = config.simplifiedStyle;

    // Áp dụng trực tiếp các style nền lên các thẻ gốc
    document.documentElement.style.backgroundColor = s.bgColor;
    document.body.style.backgroundColor = s.bgColor;
    document.body.style.color = s.textColor;
    document.body.style.margin = '0';
    document.body.style.padding = '0';

    // Xóa thẻ style động cũ nếu có để tránh trùng lặp
    removeElementById('tm-simplified-dynamic-style');

    const linkColor = s.bgColor.includes('292a2d') ? '#79c0ff' : '#0056b3';

    // *** CSS MỚI: Ghi đè mạnh mẽ hơn để đảm bảo style được áp dụng ***
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

    if (originalBodyClone) {
        // Tắt các style đã áp dụng lên <html>
        document.documentElement.style.backgroundColor = '';

        // Hoàn toàn thay thế body hiện tại bằng bản sao gốc đã lưu
        document.body.replaceWith(originalBodyClone.cloneNode(true));

        // Reset trạng thái và tái tạo lại các nút bấm
        simplifiedActive = false;
        removeFloatingButtons(); // Xóa các nút cũ (nút style)
        showFloatingButtons(); // Tạo lại các nút mới (chỉ nút edit)

        // Phục hồi lại selection handler
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

    } else {
        // Fallback an toàn nhất nếu không có bản sao
        location.reload();
    }
}
// --- KẾT THÚC THAY THẾ KHU VỰC SIMPLIFIED VIEW ---

/* ================== AUTO TRANSLATE NEW CONTENT ================== */
async function translateNewNodes(nodes) {
    console.log('[tm-translate] Bắt đầu dịch nội dung mới...');
    config = loadConfig();
    const nameSet = config.nameSets[config.activeNameSet] || {};
    const replacer = buildNameSetReplacer(nameSet);

    const items = collectTranslatableItems(config.includeScriptStyle, nodes);
    if (!items || items.length === 0) {
        return;
    }

    const placeholderMaps = [];
    const modifiedContents = items.map(it => {
        const pmap = {};
        const after = replacer(it.original || '', pmap);
        placeholderMaps.push(pmap);
        return after;
    });

    const batches = splitIntoBatches(modifiedContents, config.maxCharsPerRequest);
    let translatedResults = [];
    for (const batchArr of batches) {
        try {
            const json = await postTranslate(config.serverUrl, batchArr.join('\n'), config.targetLang);
            const translatedRaw = json?.data?.content ?? json?.translatedText;
            if (typeof translatedRaw !== 'string') continue;
            translatedResults.push(...translatedRaw.split('\n'));
            await sleep(config.delayMs);
        } catch (e) {
            console.error('[tm-translate] Lỗi khi dịch nội dung mới:', e);
            return;
        }
    }

    const restorePlaceholders = (text, pmap) => Object.entries(pmap).reduce((acc, [ph, data]) => acc.split(ph).join(data.viet), text);

    for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (!translatedResults[i]) continue;
        const finalPlainText = restorePlaceholders(translatedResults[i], placeholderMaps[i] || {});
        try {
            if (it.type === 'text' && it.node?.isConnected) it.node.nodeValue = finalPlainText;
            else if (it.type === 'attribute' && it.element?.isConnected) it.element.setAttribute(it.attribute, finalPlainText);
        } catch (e) { /* ignore */ }
    }
    console.log('[tm-translate] Dịch nội dung mới hoàn tất.');
}
function startAutoTranslateObserver() {
    // Nếu observer đã tồn tại, ngắt nó đi trước khi tạo mới
    if (window.tmTranslateObserver) window.tmTranslateObserver.disconnect();

    // Debounce: Chờ 500ms sau khi trang ngừng thay đổi rồi mới dịch
    let debounceTimeout;
    const observerCallback = (mutationsList, observer) => {
        const hasRelevantChanges = mutationsList.some(m => m.addedNodes.length > 0 && Array.from(m.addedNodes).some(n => n.nodeType === 1 && !n.closest('[id^="tm-"]')));

        if (hasRelevantChanges) {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => {
                console.log("[tm-translate] Phát hiện nội dung mới. Bắt đầu dịch bổ sung...");
                // Dịch toàn bộ body để bắt các thay đổi một cách an toàn nhất
                // Hàm startTranslateAction đã đủ thông minh để không dịch lại những gì đã dịch
                // và chỉ áp dụng lên các text node mới.
                translateNewNodes(Array.from(document.body.childNodes));
            }, 500);
        }
    };

    window.tmTranslateObserver = new MutationObserver(observerCallback);
    window.tmTranslateObserver.observe(document.body, { childList: true, subtree: true });
    console.log('[tm-translate] Đã bật chế độ tự động dịch nội dung mới.');
}
/* ================== EDIT MODAL & HELPERS ================== */
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


function openEditModalForSelection() {
    // Lấy selection hiện tại, nếu rỗng thì fallback về lastSelectionRange (đã lưu trước khi click button)
    let sel = window.getSelection();
    let selectedText = sel && sel.toString ? sel.toString().trim() : '';

    if ((!selectedText || selectedText.length === 0) && lastSelectionRange) {
        // Nếu selection bị mất vì click, dùng snapshot lưu trước
        if (lastSelectionRange._textSnapshot) {
            selectedText = lastSelectionRange._textSnapshot.trim();
        } else {
            try {
                selectedText = lastSelectionRange.toString().trim();
            } catch (e) {
                selectedText = '';
            }
        }
    }

    if (!selectedText) {
        alert('Vui lòng bôi đen một đoạn văn bản đã được dịch.');
        return;
    }

    if (!lastTranslationState) {
        alert('Chưa có trạng thái dịch. Hãy dịch trang trước khi sửa name.');
        return;
    }

    const { items, translatedResults, placeholderMaps } = lastTranslationState;

    // 1) Nếu selection khớp trực tiếp với một tên trong placeholderMaps thì mở modal ngay
    for (let i = 0; i < placeholderMaps.length; i++) {
        const pmap = placeholderMaps[i] || {};
        for (const ph in pmap) {
            const nameData = pmap[ph];
            if (nameData && nameData.viet && nameData.viet.includes(selectedText)) {
                showEditModal(nameData.orig, nameData.viet);
                return;
            }
        }
    }

    // 2) Nếu không tìm thấy trong map, tìm trong translatedResults từng chunk
    for (let i = 0; i < translatedResults.length; i++) {
        let chunk = translatedResults[i] || '';
        // restore placeholders to readable Vietnamese for searching
        const pmap = placeholderMaps[i] || {};
        chunk = chunk.replace(/__TM_NAME_\d+__/g, (m) => (pmap[m] && pmap[m].viet) ? pmap[m].viet : m);
        if (chunk && chunk.includes(selectedText)) {
            // show modal with corresponding original (items[i].original) and the chunk
            showEditModal(items[i].original || '', chunk);
            return;
        }
    }

    alert('Không tìm thấy cụm từ gốc tương ứng. Hãy thử chọn nhiều ký tự hơn hoặc dịch lại trang.');
}

function showEditModal(chinese, vietnamese) {
    removeElementById('tm-edit-modal');
    const wrapper = document.createElement('div');
    wrapper.id = 'tm-edit-modal';
    wrapper.className = 'tm-modal-wrapper';

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

    // Hàm để kiểm tra và cập nhật giao diện
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



    // Hàm để gắn listener cho các nút động
    function attachActionListeners() {
        const btnAdd = document.getElementById('tm-edit-add');
        const btnSave = document.getElementById('tm-edit-save');
        const btnDelete = document.getElementById('tm-edit-delete');

        const actionHandler = async (action) => {
            const key = origInput.value.trim();
            const value = vietInput.value.trim();
            const setName = config.activeNameSet;

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
            showLoading('Đang đồng bộ lại trang...');
            await retranslateNodesForChinese(key);
            removeLoading();
        };

        if (btnAdd) btnAdd.onclick = () => actionHandler('add');
        if (btnSave) btnSave.onclick = () => actionHandler('save');
        if (btnDelete) btnDelete.onclick = () => actionHandler('delete');
    }

    // Listener để kiểm tra trực tiếp khi gõ
    origInput.addEventListener('input', checkNameAndRefreshUI);

    const close = () => wrapper.remove();
    wrapper.querySelector('.tm-modal-backdrop').addEventListener('click', close);
    wrapper.querySelector('#tm-edit-close').addEventListener('click', close);

    wrapper.querySelector('#tm-edit-suggest-btn').addEventListener('click', () => {
        showSuggestionModal(origInput.value, vietInput.value, (newViet) => {
            vietInput.value = newViet;
        });
    });

    // Chạy lần đầu để khởi tạo UI
    checkNameAndRefreshUI();
}

async function buildHanVietFromMap(chinese, map) {
    if (!map || !chinese) return '';
    // Xử lý đa âm, lấy âm đầu tiên
    return Array.from(chinese).map(c => (map[c] || c).split('/')[0]).join(' ');
}

function progressiveCapitalizations(s) {
    const words = s.split(/\s+/).filter(Boolean);
    if (words.length === 0) return [];
    const lines = [words.join(' ').toLowerCase()]; // Dòng đầu không in hoa
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
    wrapper.style.zIndex = '2147483647'; // Hiển thị trên cả modal edit

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

    // Xử lý cột gợi ý từ server
    const currentCol = wrapper.querySelector('#tm-suggest-current-col');
    currentCol.innerHTML = "<p>Đang dịch...</p>";
    (async () => {
        try {
            const json = await postTranslate(config.serverUrl, chinese, config.targetLang);
            const translatedText = json?.data?.content ?? json?.translatedText;
            if (typeof translatedText === 'string') {
                const lines = progressiveCapitalizations(translatedText.trim());
                currentCol.innerHTML = lines.map(line => `<div class="tm-suggest-item">${escapeHtml(line)}</div>`).join('');
            } else {
                throw new Error('Phản hồi dịch không hợp lệ');
            }
        } catch (error) {
            console.error("Lỗi khi dịch gợi ý:", error);
            currentCol.innerHTML = `<p style="color:red;">Dịch gợi ý thất bại.</p><p>Bản dịch hiện tại:</p>`;
            const currentLines = progressiveCapitalizations(vietnamese); // Fallback về hành vi cũ
            currentCol.innerHTML += currentLines.map(line => `<div class="tm-suggest-item">${escapeHtml(line)}</div>`).join('');
        }
    })();

    // Xử lý cột Hán-Việt (giữ nguyên)
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

    // Gắn listener cho các dòng gợi ý
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

async function retranslateNodesForChinese(chineseKey) {
    console.log(`Name liên quan đến "${chineseKey}" đã thay đổi. Bắt đầu làm mới toàn bộ trang...`);
    showLoading('Phục hồi trang gốc...');
    await sleep(50); // Cho phép UI hiển thị loading

    if (originalBodyClone) {
        // 1. Khôi phục lại trang về trạng thái chưa dịch
        document.body.replaceWith(originalBodyClone.cloneNode(true));
        console.log('[tm-translate] Đã phục hồi body gốc để dịch lại.');

        // 2. Reset lại các trạng thái và nút bấm
        lastTranslationState = null;
        translatedBodyClone = null;
        if (simplifiedActive) {
            simplifiedActive = false; // Tắt trạng thái rút gọn nếu có
        }
        removeFloatingButtons();

        // 3. Bắt đầu dịch lại toàn bộ trang từ đầu
        console.log(`Bắt đầu dịch lại từ đầu với name set đã cập nhật.`);
        await startTranslateAction();
    } else {
        removeLoading();
        alert('Không tìm thấy bản sao trang gốc. Vui lòng tải lại trang để áp dụng thay đổi.');
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
        saveConfig(config);
        if (simplifiedActive) applySimplifiedStyle();
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
function openSettingsUI() {
    removeElementById('tm-settings-modal');
    config = loadConfig();

    const wrapper = document.createElement('div');
    wrapper.id = 'tm-settings-modal';
    wrapper.className = 'tm-modal-wrapper';

    wrapper.innerHTML = `
    <div class="tm-modal-backdrop"></div>
    <div class="tm-modal-box" style="width: 980px;">
        <div class="tm-modal-header">
            <h2>Cài đặt - TM Translate</h2>
            <button id="tm-settings-close" class="tm-btn">&times;</button>
        </div>
        <div class="tm-tabs-nav">
            <button class="tm-tab-btn active" data-tab="namesets">Bộ Tên</button>
            <button class="tm-tab-btn" data-tab="general">Chung</button>
            <button class="tm-tab-btn" data-tab="advanced">Nâng cao</button>
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
           </div>
            <!-- Advanced Tab -->
            <div id="tab-advanced" class="tm-tab-content">
                <label class="tm-label">URL Server Dịch</label>
                <input id="tm-server" class="tm-input" value="${escapeHtml(config.serverUrl)}" />
                <label class="tm-label">URL file Hán-Việt JSON</label>
                <input id="tm-hv-url" class="tm-input" value="${escapeHtml(config.hanvietJsonUrl || '')}" />
                <div class="tm-row">
                    <div class="tm-col"><label class="tm-label">Delay giữa các request (ms)</label><input id="tm-delay" type="number" class="tm-input" value="${config.delayMs}" /></div>
                    <div class="tm-col"><label class="tm-label">Số ký tự tối đa / request</label><input id="tm-max" type="number" class="tm-input" value="${config.maxCharsPerRequest}" /></div>
                </div>
            </div>
        </div>
        <div class="tm-modal-footer">
            <button id="tm-settings-save" class="tm-btn tm-btn-primary">Lưu & Đóng</button>
            <button id="tm-settings-cancel" class="tm-btn">Hủy</button>
        </div>
    </div>`;
    document.body.appendChild(wrapper);

    // --- Tab logic ---
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
        if(e.target.tagName !== 'BUTTON') return;
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

    // --- Init fields & Save ---
    wrapper.querySelector('#tm-simplified').value = config.simplifiedEnabled ? '1' : '0';
    wrapper.querySelector('#tm-simplified-js').checked = !!config.simplifiedBlockJS;
    refreshSetSelector();

    const close = () => wrapper.remove();
    wrapper.querySelector('.tm-modal-backdrop').addEventListener('click', close);
    wrapper.querySelector('#tm-settings-cancel').addEventListener('click', close);
    wrapper.querySelector('#tm-settings-close').addEventListener('click', close);

    wrapper.querySelector('#tm-settings-save').addEventListener('click', () => {
        // General
        config.simplifiedEnabled = wrapper.querySelector('#tm-simplified').value === '1';
        config.simplifiedBlockJS = wrapper.querySelector('#tm-simplified-js').checked;
        // Advanced
        config.serverUrl = wrapper.querySelector('#tm-server').value.trim();
        config.hanvietJsonUrl = wrapper.querySelector('#tm-hv-url').value.trim();
        config.delayMs = parseInt(wrapper.querySelector('#tm-delay').value, 10);
        config.maxCharsPerRequest = parseInt(wrapper.querySelector('#tm-max').value, 10);

        saveConfig(config);
        alert('Đã lưu cài đặt.');
        close();

        // *** LOGIC MỚI: TỰ ĐỘNG ÁP DỤNG THAY ĐỔI NẾU TRANG ĐÃ DỊCH ***
        // Biến translatedBodyClone chỉ tồn tại sau khi đã dịch thành công.
        if (translatedBodyClone) {
            console.log("Phát hiện thay đổi cài đặt khi trang đã dịch. Bắt đầu dịch lại để áp dụng...");
            retranslateNodesForChinese('cài đặt');
        }
    });
}

/* ================== MENU & INIT ================== */
GM_registerMenuCommand('Dịch', startTranslateAction);
GM_registerMenuCommand('Cài đặt', openSettingsUI);

// Expose main functions to window for debugging/advanced use
window._tm_translate = {
    start: startTranslateAction,
    settings: openSettingsUI,
    retranslateKey: retranslateNodesForChinese,
    toggleSimplified: () => simplifiedActive ? disableSimplifiedView() : enableSimplifiedView(),
    getState: () => lastTranslationState,
    getConfig: () => config,
};

injectGlobalCSS();

console.log('[tm-translate 2.0.0] Đã tải. Sử dụng menu Tampermonkey để bắt đầu.');

})();