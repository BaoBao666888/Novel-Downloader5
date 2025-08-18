// ==UserScript==
// @name         TM Translate
// @author       QuocBao
// @namespace    http://tampermonkey.net/
// @version      3.2.1
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

(function() {
'use strict';

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
    overrideFontFamily: "Noto Serif, 'Times New Roman', serif" ,
    showStartButton: true,
    autoTranslateOnScroll: true,
    nameEditingEnabled: true,
    allowCopyWhenEditing: true,
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
let translationCache = {};
let isTranslating = false;
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
function capitalizeFirstLetter(s) {
    if (typeof s !== 'string' || !s) return s;

    // Sử dụng biểu thức chính quy để tìm chữ cái Unicode đầu tiên trong chuỗi.
    // \p{L} khớp với bất kỳ chữ cái nào trong bất kỳ ngôn ngữ nào.
    // Cờ 'u' là bắt buộc để nó hoạt động với Unicode.
    const firstLetterMatch = s.match(/\p{L}/u);

    // Nếu không tìm thấy chữ cái nào (ví dụ: chuỗi chỉ có dấu câu "!!??"),
    // thì không làm gì cả, trả về chuỗi gốc.
    if (!firstLetterMatch) {
        return s;
    }

    // Lấy vị trí (index) của chữ cái đầu tiên đó.
    const index = firstLetterMatch.index;

    // Tái tạo lại chuỗi:
    // 1. Lấy tất cả các ký tự đứng trước chữ cái đầu tiên.
    const prefix = s.substring(0, index);
    // 2. Viết hoa chữ cái đầu tiên đó.
    const capitalizedChar = s.charAt(index).toUpperCase();
    // 3. Lấy phần còn lại của chuỗi.
    const suffix = s.substring(index + 1);

    // Ghép chúng lại và trả về.
    return prefix + capitalizedChar + suffix;
}
/* ================== FANQIE NOVEL DECODING ================== */
const fontMap = { 'E4B0' : '0', 'E54F' : '1', 'E4E7' : '2', 'E504' : '3', 'E49E' : '4', 'E4F6' : '5', 'E556' : '6', 'E53C' : '7', 'E47A' : '8', 'E474' : '9', 'E40D' : 'a', 'E51C' : 'b', 'E487' : 'c', 'E436' : 'd', 'E51A' : 'e', 'E43B' : 'f', 'E485' : 'g', 'E4BA' : 'h', 'E478' : 'i', 'E445' : 'j', 'E52F' : 'k', 'E49A' : 'l', 'E425' : 'm', 'E4DB' : 'n', 'E40B' : 'o', 'E3FF' : 'p', 'E488' : 'q', 'E47B' : 'r', 'E407' : 's', 'E558' : 't', 'E46B' : 'u', 'E543' : 'v', 'E417' : 'w', 'E48F' : 'x', 'E3E9' : 'y', 'E52A' : 'z', 'E428' : 'A', 'E4C1' : 'B', 'E481' : 'C', 'E43E' : 'D', 'E44A' : 'E', 'E4D3' : 'F', 'E43C' : 'G', 'E4CB' : 'H', 'E4E8' : 'I', 'E410' : 'J', 'E429' : 'K', 'E4E6' : 'L', 'E557' : 'M', 'E51D' : 'N', 'E3FC' : 'O', 'E455' : 'P', 'E470' : 'Q', 'E4B2' : 'R', 'E44E' : 'S', 'E435' : 'T', 'E41B' : 'U', 'E4B4' : 'V', 'E4EE' : 'W', 'E4BB' : 'X', 'E467' : 'Y', 'E4B9' : 'Z', 'E3F3' : '的', 'E526' : '一', 'E456' : '是', 'E517' : '了', 'E40E' : '我', 'E511' : '不', 'E41C' : '人', 'E53F' : '在', 'E54D' : '他', 'E4C0' : '有', 'E473' : '这', 'E4FB' : '个', 'E54A' : '上', 'E453' : '们', 'E528' : '来', 'E44F' : '到', 'E42B' : '时', 'E440' : '大', 'E480' : '地', 'E4C2' : '为', 'E53D' : '子', 'E42C' : '中', 'E489' : '你', 'E47C' : '说', 'E4A5' : '生', 'E42A' : '国', 'E4C5' : '年', 'E548' : '着', 'E443' : '就', 'E553' : '那', 'E47F' : '和', 'E420' : '要', 'E406' : '她', 'E4C8' : '出', 'E3FE' : '也', 'E41F' : '得', 'E4A8' : '里', 'E534' : '后', 'E4C4' : '自', 'E4DF' : '以', 'E51F' : '会', 'E4E2' : '家', 'E502' : '可', 'E438' : '下', 'E551' : '而', 'E539' : '过', 'E54C' : '天', 'E44D' : '去', 'E498' : '能', 'E52C' : '对', 'E431' : '小', 'E45B' : '多', 'E4A4' : '然', 'E501' : '于', 'E46C' : '心', 'E4D5' : '学', 'E42E' : '么', 'E541' : '之', 'E500' : '都', 'E4FE' : '好', 'E52E' : '看', 'E448' : '起', 'E45E' : '发', 'E49B' : '当', 'E427' : '没', 'E545' : '成', 'E464' : '只', 'E41D' : '如', 'E459' : '事', 'E458' : '把', 'E4D6' : '还', 'E4FF' : '用', 'E4F9' : '第', 'E48C' : '样', 'E450' : '道', 'E54B' : '想', 'E465' : '作', 'E4B5' : '种', 'E4FC' : '开', 'E524' : '美', 'E48D' : '总', 'E512' : '从', 'E457' : '无', 'E40A' : '情', 'E52D' : '己', 'E441' : '面', 'E404' : '最', 'E50B' : '女', 'E4DC' : '但', 'E3EB' : '现', 'E466' : '前', 'E51B' : '些', 'E4CF' : '所', 'E503' : '同', 'E508' : '日', 'E49D' : '手', 'E43F' : '又', 'E559' : '行', 'E4D8' : '意', 'E4B6' : '动', 'E4CD' : '方', 'E4C3' : '期', 'E44C' : '它', 'E493' : '头', 'E469' : '经', 'E52B' : '长', 'E521' : '儿', 'E4AA' : '回', 'E4F8' : '位', 'E4D7' : '分', 'E3F6' : '爱', 'E3FD' : '老', 'E531' : '因', 'E4F4' : '很', 'E446' : '给', 'E49C' : '名', 'E409' : '法', 'E439' : '间', 'E422' : '斯', 'E3F5' : '知', 'E53A' : '世', 'E510' : '什', 'E523' : '两', 'E505' : '次', 'E48A' : '使', 'E4EB' : '身', 'E4D1' : '者', 'E525' : '被', 'E4BF' : '高', 'E41A' : '已', 'E4B3' : '亲', 'E4DA' : '其', 'E546' : '进', 'E515' : '此', 'E3EE' : '话', 'E400' : '常', 'E50A' : '与', 'E461' : '活', 'E4CC' : '正', 'E4CE' : '感', 'E4F5' : '见', 'E4D0' : '明', 'E433' : '问', 'E4A2' : '力', 'E3FB' : '理', 'E468' : '尔', 'E4B1' : '点', 'E550' : '文', 'E403' : '几', 'E542' : '定', 'E4A9' : '本', 'E527' : '公', 'E4BD' : '特', 'E4BC' : '做', 'E460' : '外', 'E463' : '孩', 'E532' : '相', 'E45A' : '西', 'E475' : '果', 'E42D' : '走', 'E408' : '将', 'E3F0' : '月', 'E3EA' : '十', 'E449' : '实', 'E432' : '向', 'E4A1' : '声', 'E43A' : '车', 'E472' : '全', 'E509' : '信', 'E49F' : '重', 'E519' : '三', 'E514' : '机', 'E4FA' : '工', 'E3F1' : '物', 'E53B' : '气', 'E413' : '每', 'E50E' : '并', 'E554' : '别', 'E4AB' : '真', 'E536' : '打', 'E412' : '太', 'E45F' : '新', 'E4DD' : '比', 'E520' : '才', 'E3ED' : '便', 'E51E' : '夫', 'E4EF' : '再', 'E540' : '书', 'E50F' : '部', 'E3F2' : '水', 'E486' : '像', 'E522' : '眼', 'E46F' : '等', 'E3E8' : '体', 'E3EF' : '却', 'E454' : '加', 'E424' : '电', 'E405' : '主', 'E45C' : '界', 'E423' : '门', 'E418' : '利', 'E4F2' : '海', 'E415' : '受', 'E4ED' : '听', 'E3F9' : '表', 'E555' : '德', 'E421' : '少', 'E401' : '克', 'E4A6' : '代', 'E411' : '员', 'E530' : '许', 'E4D2' : '稜', 'E47E' : '先', 'E430' : '口', 'E4E0' : '由', 'E4E1' : '死', 'E476' : '安', 'E444' : '写', 'E490' : '性', 'E4C6' : '马', 'E40C' : '光', 'E4F3' : '白', 'E513' : '或', 'E4D4' : '住', 'E55B' : '难', 'E414' : '望', 'E416' : '教', 'E4B8' : '命', 'E499' : '花', 'E537' : '结', 'E496' : '乐', 'E533' : '色', 'E4D9' : '更', 'E544' : '拉', 'E549' : '东', 'E437' : '神', 'E518' : '记', 'E491' : '处', 'E4E3' : '让', 'E479' : '母', 'E46E' : '父', 'E495' : '应', 'E4F7' : '直', 'E4A0' : '字', 'E484' : '场', 'E402' : '平', 'E4EC' : '报', 'E4A3' : '友', 'E497' : '关', 'E3F4' : '放', 'E4CA' : '至', 'E482' : '张', 'E4C7' : '认', 'E4C9' : '接', 'E46D' : '告', 'E4AC' : '入', 'E50C' : '笑', 'E4A7' : '内', 'E4B7' : '英', 'E419' : '军', 'E55A' : '候', 'E471' : '民', 'E4FD' : '岁', 'E535' : '往', 'E42F' : '何', 'E43D' : '度', 'E4F1' : '山', 'E4DE' : '觉', 'E552' : '路', 'E547' : '带', 'E3F7' : '万', 'E426' : '男', 'E4BE' : '边', 'E3FA' : '风', 'E462' : '解', 'E4EA' : '叫', 'E47D' : '任', 'E4E9' : '金', 'E3EC' : '快', 'E4F0' : '原', 'E452' : '吃', 'E54E' : '妈', 'E41E' : '变', 'E447' : '通', 'E4AD' : '师', 'E529' : '立', 'E4AE' : '象', 'E451' : '数', 'E506' : '四', 'E4E4' : '失', 'E50D' : '满', 'E483' : '战', 'E442' : '远', 'E538' : '格', 'E4E5' : '士', 'E492' : '音', 'E434' : '轻', 'E48E' : '目', 'E53E' : '条', 'E40F' : '呢', };

function decodeFanqieGeneralText(text) {
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
    const CHARSET = ['D', '在', '主', '特', '家', '军', '然', '表', '场', '4', '要', '只', 'v', '和', '?', '6', '别', '还', 'g', '现', '儿', '岁', '?', '?', '此', '象', '月', '3', '出', '战', '工', '相', 'o', '男', '首', '失', '世', 'F', '都', '平', '文', '什', 'V', 'O', '将', '真', 'T', '那', '当', '?', '会', '立', '些', 'u', '是', '十', '张', '学', '气', '大', '爱', '两', '命', '全', '后', '东', '性', '通', '被', '1', '它', '乐', '接', '而', '感', '车', '山', '公', '了', '常', '以', '何', '可', '话', '先', 'p', 'i', '叫', '轻', 'M', '士', 'w', '着', '变', '尔', '快', 'l', '个', '说', '少', '色', '里', '安', '花', '远', '7', '难', '师', '放', 't', '报', '认', '面', '道', 'S', '?', '克', '地', '度', 'I', '好', '机', 'U', '民', '写', '把', '万', '同', '水', '新', '没', '书', '电', '吃', '像', '斯', '5', '为', 'y', '白', '几', '日', '教', '看', '但', '第', '加', '候', '作', '上', '拉', '住', '有', '法', 'r', '事', '应', '位', '利', '你', '声', '身', '国', '问', '马', '女', '他', 'Y', '比', '父', 'x', 'A', 'H', 'N', 's', 'X', '边', '美', '对', '所', '金', '活', '回', '意', '到', 'z', '从', 'j', '知', '又', '内', '因', '点', 'Q', '三', '定', '8', 'R', 'b', '正', '或', '夫', '向', '德', '听', '更', '?', '得', '告', '并', '本', 'q', '过', '记', 'L', '让', '打', 'f', '人', '就', '者', '去', '原', '满', '体', '做', '经', 'K', '走', '如', '孩', 'c', 'G', '给', '使', '物', '?', '最', '笑', '部', '?', '员', '等', '受', 'k', '行', '一', '条', '果', '动', '光', '门', '头', '见', '往', '自', '解', '成', '处', '天', '能', '于', '名', '其', '发', '总', '母', '的', '死', '手', '入', '路', '进', '心', '来', 'h', '时', '力', '多', '开', '己', '许', 'd', '至', '由', '很', '界', 'n', '小', '与', 'Z', '想', '代', '么', '分', '生', '口', '再', '妈', '望', '次', '西', '风', '种', '带', 'J', '?', '实', '情', '才', '这', '?', 'E', '我', '神', '格', '长', '觉', '间', '年', '眼', '无', '不', '亲', '关', '结', '0', '友', '信', '下', '却', '重', '己', '老', '2', '音', '字', 'm', '呢', '明', '之', '前', '高', 'P', 'B', '目', '太', 'e', '9', '起', '稜', '她', '也','W', '用', '方', '子', '英', '每', '理', '便', '西', '数', '期', '中', 'C', '外', '样', 'a', '海', '们','任'];
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
    // 1. Ghi đè CSS một cách tuyệt đối để BẮT BUỘC cho phép tô đen
    const css = '*, :after, :before { -webkit-user-select: text !important; -moz-user-select: text !important; -ms-user-select: text !important; user-select: text !important; cursor: auto !important; }';
    removeElementById('tm-unlock-style');
    const style = document.createElement('style');
    style.id = 'tm-unlock-style';
    style.type = 'text/css';
    style.appendChild(document.createTextNode(css));
    (document.head || document.documentElement).appendChild(style);

    // 2. Vô hiệu hóa các trình xử lý sự kiện `on...` trên TOÀN BỘ trang
    const eventsToNullify = [
        'oncontextmenu', 'onselectstart', 'ondragstart', 'onmousedown', 'onkeydown'
    ];
    document.querySelectorAll('*').forEach(el => {
        eventsToNullify.forEach(eventName => {
            if (el[eventName]) el[eventName] = null;
        });
    });

    // 3. Chặn đứng các sự kiện ở tầng sâu nhất (Capture Phase)
    // Đây là bước quan trọng nhất, ngăn script của trang web nhận được sự kiện
    const eventsToStop = [
        'contextmenu', 'selectstart', 'dragstart', 'mousedown', 'keydown', 'copy', 'cut'
    ];
    const interceptor = (e) => {
        e.stopPropagation();
    };
    eventsToStop.forEach(event => {
        document.addEventListener(event, interceptor, { capture: true });
    });

    // 4. Ghi đè các hàm phổ biến dùng để khóa chuột
    try {
        if (typeof window.jQuery === 'function') {
            window.jQuery(document).off('contextmenu');
            window.jQuery('body').off('contextmenu');
        }
    } catch (e) { /* Bỏ qua nếu có lỗi */}

    console.log('[tm-translate] Đã kích hoạt chế độ giải phóng chuột và tô đen văn bản.');
}

function applyGlobalFontOverride() {
    // Xóa style cũ nếu có để cập nhật
    removeElementById('tm-font-override-style');

    // Chỉ chạy khi người dùng đã bật tính năng này trong cài đặt
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
    // Kiểm tra điều kiện "mạnh tay"
    if (config.nameEditingEnabled && config.allowCopyWhenEditing) {
        // Nếu đủ điều kiện, gọi hàm unlock
        unlockPageInteraction();
    } else {
        // Trong MỌI trường hợp khác, gỡ bỏ can thiệp
        removeElementById('tm-unlock-style');
        // (Chúng ta không thể gỡ các event listener đã thêm một cách dễ dàng,
        // nhưng việc gỡ bỏ CSS đã giải quyết 90% vấn đề hiển thị và hành vi)
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
function showFloatingButtons() {
    removeFloatingButtons();
    if (config.nameEditingEnabled) {
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
    }

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
function createStartButton() {
    // Nếu trang đã dịch rồi thì không hiện nút này nữa
     if (translatedBodyClone || !config.showStartButton) return;
    if (translatedBodyClone) return;

    removeElementById('tm-start-translate-btn');
    const startBtn = document.createElement('div');
    startBtn.id = 'tm-start-translate-btn';
    startBtn.className = 'tm-float-btn';
    startBtn.style.backgroundColor = '#28a745'; // Màu xanh lá
    startBtn.style.right = '18px';
    startBtn.style.bottom = '18px';
    startBtn.title = 'Bắt đầu dịch trang này';
    startBtn.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M21.79,6.22C20.21,4.64,18,4,15.5,4c-2.12,0-3.88,0.64-5.23,1.93L12,7.66l1.41,1.41l-2.42,2.42l-2.42-2.42L10,7.66 C10,7.66,10,7.66,10,7.66L8.59,6.24C7.7,5.36,6.58,4.8,5.25,4.8C4.19,4.8,3.2,5.1,2.4,5.9C0.83,7.47,0.83,10,2.4,11.6l4.24,4.24 c0.78,0.78,1.8,1.17,2.83,1.17s2.05-0.39,2.83-1.17l1.41-1.41l-1.41-1.41L12,14.34l-1.06-1.06c-0.39-0.39-0.39-1.02,0-1.41 s1.02-0.39,1.41,0l1.06,1.06l2.42-2.42l1.41,1.41l-1.41,1.41c-1.56,1.56-4.09,1.56-5.66,0l-4.24-4.24c-1.17-1.17-1.17-3.07,0-4.24 c0.75-0.75,1.76-1.12,2.83-1.12s2.08,0.38,2.83,1.12l1.41,1.41L12,7.66l2.42,2.42l1.41-1.41L14.41,7.24c1.35-1.29,3.11-1.93,5.23-1.93 c2.5,0,4.71,0.64,6.29,2.21c1.56,1.56,1.56,4.09,0,5.66l-2.12,2.12l-1.41-1.41l2.12-2.12C22.96,10.32,22.96,7.79,21.79,6.22z"/></svg>`;

    // Khi click, nó sẽ gọi hàm startTranslateAction (hàm này đã có cơ chế chống click nhiều lần)
    startBtn.addEventListener('click', startTranslateAction);
    document.body.appendChild(startBtn);
}
function updateStartButtonVisibility() {
    if (config.showStartButton) {
        createStartButton();
    } else {
        removeElementById('tm-start-translate-btn');
    }
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

function restoreNames(text, placeholderMap) {
    if (!text || !placeholderMap) return text;
    let result = text;
    for (const placeholder in placeholderMap) {
        // Sử dụng regex để đảm bảo thay thế tất cả các lần xuất hiện của placeholder
        const regex = new RegExp(placeholder.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
        result = result.replace(regex, placeholderMap[placeholder].viet);
    }
    return result;
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

                        // ** SỬA LỖI: Dọn dẹp chuỗi JSON trước khi parse **
                        // 1. Loại bỏ các ký tự điều khiển ASCII không hợp lệ (0-31) ngoại trừ tab, newline...
                        // 2. Thay thế các dấu \ đơn lẻ (nguyên nhân chính gây lỗi) bằng \\
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

function highlightNamesInText(translatedText, nameSet) {
    let finalHtml = escapeHtml(translatedText);
    const vietToOrigMap = {};
    for (const orig in nameSet) {
        vietToOrigMap[nameSet[orig]] = orig;
    }

    const vietNames = Object.keys(vietToOrigMap).sort((a, b) => b.length - a.length);

    for (const vietName of vietNames) {
        if (!vietName) continue;

        const regex = new RegExp(escapeHtml(vietName).replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');

        // Chỉ thay thế nếu tìm thấy
        if (regex.test(finalHtml)) {
             const origName = vietToOrigMap[vietName];
             const replacementHtml = `<span class="tm-name" data-orig="${escapeHtml(origName)}">${escapeHtml(vietName)}</span>`;
             finalHtml = finalHtml.replace(regex, replacementHtml);
        }
    }
    return finalHtml;
}



function tokenizeString(str) {
    if (!str) return [];
    // Regex này giờ sẽ chỉ coi những thứ như emoji hoặc ký tự lạ là "special".
    const specialCharsRegex = /([^a-zA-Z0-9\u4e00-\u9fa5\s。，、？！：；“”‘’（）《》]+)/g;
    const parts = str.split(specialCharsRegex).filter(Boolean);
    const tokens = [];
    for (const part of parts) {
        // Dùng test() trên regex gốc để đảm bảo phân loại đúng
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
            if (translatedIndex < translatedTexts.length) {
                result += translatedTexts[translatedIndex];
                translatedIndex++;
            }
        } else { // type === 'special'
            result += token.value;
        }
    }
    return result;
}


async function startTranslateAction() {
    if (isTranslating) {
        showNotification("Đang dịch, vui lòng đợi...", 2000);
        return;
    }
    isTranslating = true;
    removeElementById('tm-start-translate-btn');

    try {
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
        items.forEach(item => {
            const hostname = window.location.hostname;
            const pathname = window.location.pathname;

            item.decodedOriginal = item.original; // Mặc định gán bản gốc
            if (hostname.includes('fanqienovel.com')) {
                if (pathname.startsWith('/reader/')) {
                    item.decodedOriginal = decodeFanqieReaderText(item.original);
                } else {
                    item.decodedOriginal = decodeFanqieGeneralText(item.original);
                }
            }
            item.tokens = tokenizeString(item.decodedOriginal);
            item.tokens.forEach(token => {
                if (token.type === 'text' && token.value.trim()) {
                    const processedText = nameReplacer(token.value, placeholderMap);
                    textsToSend.push(processedText);
                }
            });
        });

        const batches = splitIntoBatches(textsToSend, config.maxCharsPerRequest);
        showLoading(`Đang dịch... (0/${batches.length} gói)`);
        let allTranslatedTexts = [];
        for (let b = 0; b < batches.length; b++) {
            showLoading(`Đang dịch... (${b + 1}/${batches.length} gói)`);
            const translatedBatch = await postTranslate(config.serverUrl, batches[b], config.targetLang);
            allTranslatedTexts.push(...(translatedBatch || []));
            if (b < batches.length - 1) await sleep(config.delayMs);
        }

        let translationIdx = 0;
        translationCache = {};
        items.forEach(item => {
            const numTextTokens = item.tokens.filter(t => t.type === 'text' && t.value.trim()).length;
            const translatedParts = allTranslatedTexts.slice(translationIdx, translationIdx + numTextTokens);
            const reassembledText = reassembleTranslatedString(item.tokens, translatedParts);

            item.translated = restoreNames(reassembledText, placeholderMap);

            translationIdx += numTextTokens;
            if (item.decodedOriginal && item.translated) {
                translationCache[item.decodedOriginal] = item.translated;
            }
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
                    chunkSpan.dataset.orig = originalItem.decodedOriginal; // Dùng bản đã giải mã
                    chunkSpan.innerHTML = highlightedHtml;

                    if (itemInClone.type === 'link') {
                        itemInClone.node.innerHTML = '';
                        itemInClone.node.appendChild(chunkSpan);
                    } else {
                        itemInClone.node.parentNode.replaceChild(chunkSpan, itemInClone.node);
                    }
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

        removeLoading();

        if (config.simplifiedEnabled) {
            // Nếu bật chế độ rút gọn, ĐỪNG thay thế body.
            // Thay vào đó, gọi hàm enableSimplifiedView, nó sẽ tự xử lý.
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
        showFloatingButtons();
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

function buildSimplifiedHtml(translatedItems) {
    let html = '';
    const nameSet = config.nameSets[config.activeNameSet] || {};
    const showOriginal = config.simplifiedShowOriginal || false;

    translatedItems.forEach(item => {
        if (item.type !== 'text' && item.type !== 'link') return;

        const originalTextToShow = item.decodedOriginal || item.original;

        // Luôn chuẩn hóa bản dịch trước
        const finalTranslatedText = capitalizeFirstLetter((item.translated || '').trim());

        let p = document.createElement('p');
        let finalContent; // Đây sẽ là node cuối cùng được chèn vào <p> hoặc <a>

        if (showOriginal) {
            // Nếu hiển thị bản gốc, chỉ chèn text đã được escape
            finalContent = document.createTextNode(originalTextToShow);
        } else {
            // Nếu hiển thị bản dịch...
            if (config.nameEditingEnabled) {
                // ...và chế độ sửa tên BẬT:
                const chunkSpan = document.createElement('span');
                chunkSpan.className = 'tm-chunk';
                chunkSpan.dataset.orig = originalTextToShow;
                // Nội dung bên trong là bản dịch đã được highlight name
                chunkSpan.innerHTML = highlightNamesInText(finalTranslatedText, nameSet);
                finalContent = chunkSpan;
            } else {
                // ...và chế độ sửa tên TẮT:
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
        // Xóa tất cả các thẻ script trên toàn bộ trang
        document.querySelectorAll('script, iframe').forEach(el => el.remove());
        // Vô hiệu hóa tất cả các event handler inline
        const allElements = document.querySelectorAll('*');
        allElements.forEach(el => {
            for (const attr of el.attributes) {
                if (attr.name.startsWith('on')) {
                    el.removeAttribute(attr.name);
                }
            }
        });
    }

    // Dọn dẹp head của trang gốc
    document.head.querySelectorAll('link[rel="stylesheet"], style').forEach(el => {
        if (!el.src?.includes('tampermonkey') && !el.id.startsWith('tm-')) {
            el.remove();
        }
    });

    // 2. Cài lại CSS toàn cục của script để đảm bảo giao diện không bị hỏng
    injectGlobalCSS();
    const cleanContentHtml = buildSimplifiedHtml(lastTranslationState.items);

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

//     if (originalBodyClone) {
//         // Tắt các style đã áp dụng lên <html>
//         document.documentElement.style.backgroundColor = '';

//         // Hoàn toàn thay thế body hiện tại bằng bản sao gốc đã lưu
//         document.body.replaceWith(originalBodyClone.cloneNode(true));

//         // Reset trạng thái và tái tạo lại các nút bấm
//         simplifiedActive = false;
//         removeFloatingButtons(); // Xóa các nút cũ (nút style)
//         showFloatingButtons(); // Tạo lại các nút mới (chỉ nút edit)

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
// --- KẾT THÚC THAY THẾ KHU VỰC SIMPLIFIED VIEW ---

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

            if (config.nameEditingEnabled) {
                const chunkSpan = document.createElement('span');
                chunkSpan.className = 'tm-chunk';
                chunkSpan.dataset.orig = it.decodedOriginal;

                chunkSpan.innerHTML = highlightedHtml;

                if (it.type === 'link') {
                    // Nếu là link, cần xử lý cẩn thận để không xóa thẻ <a>
                    const linkParent = it.node.parentNode;
                    if(linkParent && linkParent.tagName === 'A') {
                        linkParent.innerHTML = ''; // Xóa text cũ bên trong link
                        linkParent.appendChild(chunkSpan);
                    } else {
                        // Trường hợp hiếm gặp, thay thế như bình thường
                        it.node.parentNode.replaceChild(chunkSpan, it.node);
                    }
                } else {
                    it.node.parentNode.replaceChild(chunkSpan, it.node);
                }
            } else {
                const parent = it.node.parentNode;
                if (parent && parent.nodeType === 1) {
                     parent.setAttribute('title', `Dịch từ: ${it.decodedOriginal.trim()}`);
                }
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
async function translateNewNodes(nodes) {
    // Tạm dừng observer để tránh vòng lặp vô tận
    if (window.tmTranslateObserver) window.tmTranslateObserver.disconnect();

    const allNewItems = collectTranslatableItems(config.includeScriptStyle, nodes);
    if (!allNewItems.length) {
        // Nếu không có gì để dịch, bật lại observer và thoát
        if (window.tmTranslateObserver) window.tmTranslateObserver.observe(document.body, { childList: true, subtree: true });
        return;
    }

    // *** LOGIC SỬA ĐỔI: Giải mã ngay từ đầu ***
    // 1. Luôn tạo thuộc tính 'decodedOriginal' cho tất cả các item mới
    allNewItems.forEach(item => {
        item.decodedOriginal = item.original; // Mặc định
        const hostname = window.location.hostname;
        const pathname = window.location.pathname;
        if (hostname.includes('fanqienovel.com')) {
            if (pathname.startsWith('/reader/')) {
                item.decodedOriginal = decodeFanqieReaderText(item.original);
            } else {
                item.decodedOriginal = decodeFanqieGeneralText(item.original);
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

        // Các bước còn lại (batch, post, reassemble) không thay đổi
        const batches = splitIntoBatches(textsToSend, config.maxCharsPerRequest);
        let allTranslatedTexts = [];
        for (const batchArr of batches) {
            const translatedBatch = await postTranslate(config.serverUrl, batchArr, config.targetLang);
            allTranslatedTexts.push(...(translatedBatch || []));
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

        // *** SỬA ĐỔI TOÀN BỘ LOGIC CỦA actionHandler ***
        const actionHandler = async (action) => {
            const setName = config.activeNameSet;
            const key = origInput.value.trim();
            const value = vietInput.value.trim();

            // 1. Lấy "ảnh chụp" của name-set TRƯỚC KHI thay đổi
            const oldNameSetSnapshot = JSON.parse(JSON.stringify(config.nameSets[setName] || {}));

            // 2. Thực hiện thay đổi
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

            // 3. Lưu config và đóng modal
            saveConfig(config);
            close();

            // 4. Lấy name-set MỚI SAU KHI thay đổi
            const newNameSet = config.nameSets[setName] || {};

            // 5. Gọi hàm cập nhật thông minh với đầy đủ tham số
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

    // Bắt đầu với node cụ thể nhất trong vùng chọn
    let node = range.startContainer;

    // Nếu là text node, bắt đầu tìm kiếm từ thẻ cha của nó
    if (node.nodeType === 3) {
        node = node.parentElement;
    }
    if (!node) return null;

    // Ưu tiên tìm thẻ name cụ thể, sau đó mới đến khối dịch lớn
    const nameSpan = node.closest('span.tm-name');
    if (nameSpan) return nameSpan;

    const chunkSpan = node.closest('span.tm-chunk');
    if (chunkSpan) return chunkSpan;

    // Fallback: Kiểm tra thẻ cha chung nếu vùng chọn phức tạp
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
            // *** FIX: Gửi đi một mảng chứa một phần tử, theo đúng giao thức mới ***
            const translatedArray = await postTranslate(config.serverUrl, [chinese], config.targetLang);

            // Lấy kết quả từ phần tử đầu tiên của mảng trả về
            const translatedText = translatedArray[0] || '';

            if (translatedText) {
                const lines = progressiveCapitalizations(translatedText.trim());
                currentCol.innerHTML = lines.map(line => `<div class="tm-suggest-item">${escapeHtml(line)}</div>`).join('');
            } else {
                throw new Error('Server đã trả về một bản dịch rỗng.');
            }
        } catch (error) {
            console.error("Lỗi khi dịch gợi ý:", error);
            currentCol.innerHTML = `<p style="color:red;">Dịch gợi ý thất bại.</p><p>Bản dịch hiện tại:</p>`;
            // Fallback về hành vi cũ, dùng text đã có
            const currentLines = progressiveCapitalizations(vietnamese);
            currentCol.innerHTML += currentLines.map(line => `<div class="tm-suggest-item">${escapeHtml(line)}</div>`).join('');
        }
    })();

    // Xử lý cột Hán-Việt (giữ nguyên, không cần thay đổi)
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

    // Gắn listener cho các dòng gợi ý (giữ nguyên)
    wrapper.addEventListener('click', (e) => {
        if (e.target.classList.contains('tm-suggest-item')) {
            onSelect(e.target.textContent);
            close();
        }
    });

    // Các nút Google (giữ nguyên)
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

    if (originalBodyClone) {
        // 1. Khôi phục lại body gốc từ bản sao
        document.body.replaceWith(originalBodyClone.cloneNode(true));
        console.log('[tm-translate] Đã phục hồi body gốc để dịch lại.');

        // 2. Reset các trạng thái và giao diện
        lastTranslationState = null;
        translatedBodyClone = null;
        if (simplifiedActive) simplifiedActive = false;
        removeFloatingButtons();

        // 3. Bắt đầu dịch lại toàn bộ trang từ đầu
        // startTranslateAction sẽ tự động load config mới nhất
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

        // --- GIAI ĐOẠN 1: THU THẬP TẤT CẢ CÁC CÂU CẦN DỊCH LẠI ---
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
                    // Dùng newNamesInChunk để đảm bảo index đúng với ngữ cảnh câu
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

        // --- GIAI ĐOẠN 2: GỬI ĐI DỊCH HÀNG LOẠT ---
        const allTranslatedTexts = await postTranslate(config.serverUrl, textsToTranslate, config.targetLang);

        // --- GIAI ĐOẠN 3: ÁP DỤNG KẾT QUẢ ---
        updatePlan.forEach(plan => {
            let translatedText = allTranslatedTexts[plan.translationIndex];
            if (!translatedText) return;

            if (plan.translationType === 'placeholder') {
                // *** SỬA ĐỔI: Sử dụng bản đồ đã lưu, không tạo lại nữa ***
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
            // Cập nhật lại nội dung và style
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
function openSettingsUI() {
    removeElementById('tm-settings-modal');
    config = loadConfig();
    const oldNameSetSnapshot = JSON.parse(JSON.stringify(config.nameSets[config.activeNameSet] || {}));

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
    wrapper.querySelector('#tm-override-font-enabled').checked = !!config.overrideFontEnabled;
    wrapper.querySelector('#tm-override-font-family').value = config.overrideFontFamily;
    wrapper.querySelector('#tm-show-start-btn').checked = !!config.showStartButton;
    wrapper.querySelector('#tm-auto-translate-scroll').checked = !!config.autoTranslateOnScroll;
    wrapper.querySelector('#tm-name-editing-enabled').checked = !!config.nameEditingEnabled;
    wrapper.querySelector('#tm-allow-copy-checkbox').checked = !!config.allowCopyWhenEditing;
    refreshSetSelector();
    toggleCopyOptionVisibility();

    const close = () => wrapper.remove();
    wrapper.querySelector('.tm-modal-backdrop').addEventListener('click', close);
    wrapper.querySelector('#tm-settings-cancel').addEventListener('click', close);
    wrapper.querySelector('#tm-settings-close').addEventListener('click', close);

    wrapper.querySelector('#tm-settings-save').addEventListener('click', () => {
        // General
        const oldNameEditing = config.nameEditingEnabled;
        config.nameEditingEnabled = wrapper.querySelector('#tm-name-editing-enabled').checked;
        config.allowCopyWhenEditing = wrapper.querySelector('#tm-allow-copy-checkbox').checked;

        const oldAutoTranslate = config.autoTranslateOnScroll;
        config.showStartButton = wrapper.querySelector('#tm-show-start-btn').checked;
        config.autoTranslateOnScroll = wrapper.querySelector('#tm-auto-translate-scroll').checked;
        config.simplifiedEnabled = wrapper.querySelector('#tm-simplified').value === '1';
        config.overrideFontEnabled = wrapper.querySelector('#tm-override-font-enabled').checked;
        config.overrideFontFamily = wrapper.querySelector('#tm-override-font-family').value;
        // Advanced
        config.serverUrl = wrapper.querySelector('#tm-server').value.trim();
        config.hanvietJsonUrl = wrapper.querySelector('#tm-hv-url').value.trim();
        config.delayMs = parseInt(wrapper.querySelector('#tm-delay').value, 10);
        config.maxCharsPerRequest = parseInt(wrapper.querySelector('#tm-max').value, 10);

        config.activeNameSet = setSelect.value;
        saveConfig(config);
        alert('Đã lưu cài đặt.');
        close();

        if (translatedBodyClone) {
            console.log("Phát hiện thay đổi cài đặt khi trang đã dịch. Bắt đầu dịch lại thông minh...");
            const newNameSet = config.nameSets[config.activeNameSet] || {};
            applyNameChangeLive(newNameSet, oldNameSetSnapshot);
        }
    });
}

/* ================== MENU & INIT ================== */
GM_registerMenuCommand('Dịch trang này', startTranslateAction);
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

createStartButton();

console.log('[tm-translate 3.0.0] Đã tải. Sử dụng menu Tampermonkey để bắt đầu.');

})();