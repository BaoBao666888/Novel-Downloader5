// ==UserScript==
// @name         TM Translate
// @author       QuocBao
// @namespace    http://tampermonkey.net/
// @version      3.5.5.8_beta
// @description  Dịch trang, quản lý name-sets, sửa tên, Thư viện đọc offline, OCR và TTS.
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
// @grant        GM_listValues
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
// @connect      api16-normal-c-useast1a.tiktokv.com
// @connect      translate.google.com
// @connect      gemini.google.com
// @connect      www.bing.com
// @connect      api.zalo.ai
// @connect      *.zalo.ai
// @connect      *.zdn.vn
// @connect      *.zadn.vn
// @connect      *.zmdcdn.me
// @connect      *
// @require      https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/translate/zh_to_vi/translateZhToVi.js
// @require      https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/tools/TTS_Reader_Core.user.js?v=20260629
// @require      https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js
// @require      https://unpkg.com/@oovz/esearch-ocr/dist/eSearchOCR.umd.js
// @require      https://unpkg.com/onnxruntime-web@1.22.0/dist/ort.wasm.min.js
// @require      https://unpkg.com/fflate@0.8.2/umd/index.js
// ==/UserScript==

/* global chrome */

(function () {
    'use strict';


    const __ttPolicy = (() => {
        try {
            if (!window.trustedTypes || typeof window.trustedTypes.createPolicy !== 'function') return null;
            try {
                return window.trustedTypes.createPolicy('tm-translate', { createHTML: (s) => String(s || '') });
            } catch (e1) {
                return window.trustedTypes.createPolicy('default', { createHTML: (s) => String(s || '') });
            }
        } catch (err) {
            return null;
        }
    })();

    function ttHTML(html) {
        const s = String(html || '');
        try {
            return __ttPolicy ? __ttPolicy.createHTML(s) : s;
        } catch (err) {
            return s;
        }
    }

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
        retryCount: 3,
        maxCharsPerRequest: 4500,
        includeScriptStyle: false,
        activeNameSet: 'Mặc định',
        nameSets: {
            'Mặc định': {
            }
        },
        nameSetVersion: 1,
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
        showLibraryButton: true,
        showHelpButton: true,
        readerPrefetchPercent: 50,
        libraryBackupIntervalHours: 6,
        readerMode: 'vertical', // single | vertical
        readerFullscreen: false,
        readerStyle: {
            fontFamily: "Noto Serif, 'Times New Roman', serif",
            fontSize: 18,
            lineHeight: 1.9,
            paragraphSpacing: 12,
            textIndent: 2,
            bgColor: '#f7f4ee',
            textColor: '#1f1f1f',
            paddingX: 18,
            textAlign: 'justify'
        },
        blacklist: [], // Thêm dòng này
    };
    let updateOcrStatus = null;

    /* ================== STORAGE ================== */

    function stableStringify(value) {
        if (value === null || typeof value !== 'object') return JSON.stringify(value);
        if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']';
        const keys = Object.keys(value).sort();
        return '{' + keys.map(k => JSON.stringify(k) + ':' + stableStringify(value[k])).join(',') + '}';
    }
    let lastNameSetsHash = null;

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
        if (!merged.nameSetVersion || typeof merged.nameSetVersion !== 'number') {
            merged.nameSetVersion = 1;
        }
        merged.simplifiedStyle = { ...DEFAULT_CONFIG.simplifiedStyle, ...(c.simplifiedStyle || {}) };
        merged.readerStyle = { ...DEFAULT_CONFIG.readerStyle, ...(c.readerStyle || {}) };
        {
            const backupHours = Number(merged.libraryBackupIntervalHours);
            merged.libraryBackupIntervalHours = Number.isFinite(backupHours)
                ? Math.min(168, Math.max(0.25, backupHours))
                : DEFAULT_CONFIG.libraryBackupIntervalHours;
        }
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
        lastNameSetsHash = stableStringify(merged.nameSets || {});
        return merged;
    }
    function saveConfig(cfg) {
        const nextHash = stableStringify(cfg.nameSets || {});
        if (lastNameSetsHash !== null && nextHash !== lastNameSetsHash) {
            cfg.nameSetVersion = (cfg.nameSetVersion || 1) + 1;
        } else if (!cfg.nameSetVersion || typeof cfg.nameSetVersion !== 'number') {
            cfg.nameSetVersion = 1;
        }
        lastNameSetsHash = nextHash;
        GM_setValue('tm_translate_config_v2', cfg);
    }

    function getTtsCore() {
        try {
            return (typeof globalThis !== 'undefined' && globalThis.TTSReaderCore)
                || (typeof window !== 'undefined' && window.TTSReaderCore)
                || null;
        } catch (err) {
            return null;
        }
    }

    function tmTtsClampNumber(value, min, max, fallback) {
        const n = Number(value);
        if (!Number.isFinite(n)) return fallback;
        return Math.min(max, Math.max(min, n));
    }

    function tmTtsClampInt(value, min, max, fallback) {
        return Math.round(tmTtsClampNumber(value, min, max, fallback));
    }

    function normalizeTtsSettings(settings) {
        const core = getTtsCore();
        if (core && typeof core.normalizeSettings === 'function') {
            try {
                return core.normalizeSettings(settings || {});
            } catch (err) {
                console.warn('[tm-translate] Không normalize được TTS core settings:', err);
            }
        }
        const merged = {
            ...TTS_DEFAULT_SETTINGS,
            ...(settings && typeof settings === 'object' ? settings : {})
        };
        const provider = String(merged.provider || 'browser');
        merged.provider = ['browser', 'tiktok', 'google', 'gemini', 'bing', 'zalo'].includes(provider) ? provider : 'browser';
        merged.voiceURI = String(merged.voiceURI || '');
        merged.tiktokVoiceId = String(merged.tiktokVoiceId || TTS_DEFAULT_SETTINGS.tiktokVoiceId);
        merged.googleVoiceId = String(merged.googleVoiceId || TTS_DEFAULT_SETTINGS.googleVoiceId);
        merged.geminiVoiceId = String(merged.geminiVoiceId || TTS_DEFAULT_SETTINGS.geminiVoiceId);
        merged.bingVoiceId = String(merged.bingVoiceId || TTS_DEFAULT_SETTINGS.bingVoiceId);
        merged.zaloVoiceId = String(merged.zaloVoiceId || TTS_DEFAULT_SETTINGS.zaloVoiceId);
        merged.tiktokCookieText = String(merged.tiktokCookieText || '');
        merged.zaloApiKeysText = String(merged.zaloApiKeysText || '');
        merged.prefetchEnabled = !!merged.prefetchEnabled;
        merged.prefetchCount = tmTtsClampInt(merged.prefetchCount, TTS_LIMITS.prefetchCount[0], TTS_LIMITS.prefetchCount[1], TTS_DEFAULT_SETTINGS.prefetchCount);
        merged.remoteTimeoutMs = tmTtsClampInt(merged.remoteTimeoutMs, TTS_LIMITS.remoteTimeoutMs[0], TTS_LIMITS.remoteTimeoutMs[1], TTS_DEFAULT_SETTINGS.remoteTimeoutMs);
        merged.remoteRetries = tmTtsClampInt(merged.remoteRetries, TTS_LIMITS.remoteRetries[0], TTS_LIMITS.remoteRetries[1], TTS_DEFAULT_SETTINGS.remoteRetries);
        merged.remoteMinGapMs = tmTtsClampInt(merged.remoteMinGapMs, TTS_LIMITS.remoteMinGapMs[0], TTS_LIMITS.remoteMinGapMs[1], TTS_DEFAULT_SETTINGS.remoteMinGapMs);
        merged.replaceEnabled = !!merged.replaceEnabled;
        merged.replaceRules = Array.isArray(merged.replaceRules)
            ? merged.replaceRules.map(rule => ({ from: String(rule?.from || '').trim(), to: String(rule?.to || '').trim() })).filter(rule => rule.from)
            : [];
        merged.rate = tmTtsClampNumber(merged.rate, TTS_LIMITS.rate[0], TTS_LIMITS.rate[1], TTS_DEFAULT_SETTINGS.rate);
        merged.pitch = tmTtsClampNumber(merged.pitch, TTS_LIMITS.pitch[0], TTS_LIMITS.pitch[1], TTS_DEFAULT_SETTINGS.pitch);
        merged.volume = tmTtsClampNumber(merged.volume, TTS_LIMITS.volume[0], TTS_LIMITS.volume[1], TTS_DEFAULT_SETTINGS.volume);
        merged.maxChars = tmTtsClampInt(merged.maxChars, TTS_LIMITS.maxChars[0], TTS_LIMITS.maxChars[1], TTS_DEFAULT_SETTINGS.maxChars);
        merged.segmentDelayMs = tmTtsClampInt(merged.segmentDelayMs, TTS_LIMITS.segmentDelayMs[0], TTS_LIMITS.segmentDelayMs[1], TTS_DEFAULT_SETTINGS.segmentDelayMs);
        merged.autoNext = !!merged.autoNext;
        merged.includeTitle = !!merged.includeTitle;
        merged.autoScroll = !!merged.autoScroll;
        merged.autoStartOnNextChapter = !!merged.autoStartOnNextChapter;
        merged.sleepTimerEnabled = !!merged.sleepTimerEnabled;
        merged.sleepTimerMinutes = tmTtsClampInt(merged.sleepTimerMinutes, TTS_LIMITS.sleepTimerMinutes[0], TTS_LIMITS.sleepTimerMinutes[1], TTS_DEFAULT_SETTINGS.sleepTimerMinutes);
        merged.panelCollapsed = !!merged.panelCollapsed;
        return merged;
    }

    function parseTtsSettingsValue(value) {
        if (!value) return {};
        if (typeof value === 'object') return value;
        try {
            const parsed = JSON.parse(String(value));
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch (err) {
            return {};
        }
    }

    function loadTtsSettings() {
        const core = getTtsCore();
        if (core && typeof core.getSettings === 'function') {
            try {
                return normalizeTtsSettings(core.getSettings());
            } catch (err) {
                console.warn('[tm-translate] Không đọc được TTS core settings:', err);
            }
        }

        let stored = {};
        try {
            stored = parseTtsSettingsValue(GM_getValue(TTS_STORAGE_KEY, null));
        } catch (err) {
            stored = {};
        }
        if (!Object.keys(stored).length) {
            try {
                stored = parseTtsSettingsValue(localStorage.getItem(TTS_STORAGE_KEY));
            } catch (err) {
                stored = {};
            }
        }
        return normalizeTtsSettings(stored);
    }

    function saveTtsSettings(settings) {
        const next = normalizeTtsSettings(settings);
        const core = getTtsCore();
        if (core && typeof core.saveSettings === 'function') {
            try {
                return normalizeTtsSettings(core.saveSettings(next));
            } catch (err) {
                console.warn('[tm-translate] Không lưu được TTS core settings:', err);
            }
        }
        try { GM_setValue(TTS_STORAGE_KEY, next); } catch (err) { /* ignore */ }
        try { localStorage.setItem(TTS_STORAGE_KEY, JSON.stringify(next)); } catch (err) { /* ignore */ }
        return next;
    }

    function resetTtsSettings() {
        const core = getTtsCore();
        if (core && typeof core.resetSettings === 'function') {
            try {
                return normalizeTtsSettings(core.resetSettings());
            } catch (err) {
                console.warn('[tm-translate] Không reset được TTS core settings:', err);
            }
        }
        return saveTtsSettings(TTS_DEFAULT_SETTINGS);
    }

    function getTtsProviderList() {
        const core = getTtsCore();
        if (core && typeof core.getProviderList === 'function') {
            try {
                const providers = core.getProviderList() || [];
                if (providers.length) return providers;
            } catch (err) {
                /* ignore */
            }
        }
        return [
            { id: 'browser', label: 'Browser', remote: false },
            { id: 'tiktok', label: 'TikTok', remote: true },
            { id: 'google', label: 'Google', remote: true },
            { id: 'gemini', label: 'Gemini', remote: true },
            { id: 'bing', label: 'Bing', remote: true },
            { id: 'zalo', label: 'Zalo', remote: true }
        ];
    }

    function getTtsVoices(providerId = 'browser') {
        const provider = String(providerId || 'browser');
        const core = getTtsCore();
        if (core && typeof core.getProviderVoices === 'function') {
            try {
                return core.getProviderVoices(provider) || [];
            } catch (err) {
                return [];
            }
        }
        if (provider !== 'browser') return [];
        try {
            return ('speechSynthesis' in window && typeof speechSynthesis.getVoices === 'function')
                ? (speechSynthesis.getVoices() || [])
                : [];
        } catch (err) {
            return [];
        }
    }

    function formatTtsVoiceLabel(voice) {
        if (!voice) return '';
        const name = voice.name || voice.voiceURI || voice.id || 'Voice';
        const lang = voice.lang || voice.language;
        const suffix = lang ? ` (${lang})` : '';
        return `${name}${suffix}`;
    }

    function getTtsProviderVoiceKey(providerId) {
        switch (String(providerId || 'browser')) {
            case 'tiktok': return 'tiktokVoiceId';
            case 'google': return 'googleVoiceId';
            case 'gemini': return 'geminiVoiceId';
            case 'bing': return 'bingVoiceId';
            case 'zalo': return 'zaloVoiceId';
            default: return 'voiceURI';
        }
    }

    function getTtsVoiceValue(settings, providerId) {
        const key = getTtsProviderVoiceKey(providerId);
        return String(settings && settings[key] ? settings[key] : '');
    }

    function parseTtsReplaceRulesText(text) {
        return String(text || '')
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(Boolean)
            .map((line) => {
                let parts = line.split(/\s*=>\s*/);
                if (parts.length < 2) parts = line.split(/\t+/);
                if (parts.length < 2) parts = line.split(/\s*=\s*/);
                const from = String(parts.shift() || '').trim();
                const to = String(parts.join('=').trim());
                return { from, to };
            })
            .filter(rule => rule.from);
    }

    function formatTtsReplaceRulesText(rules) {
        const list = Array.isArray(rules) ? rules : [];
        return list
            .map(rule => `${String(rule?.from || '').trim()} => ${String(rule?.to || '').trim()}`)
            .filter(line => line.trim().replace(/\s*=>\s*$/, ''))
            .join('\n');
    }

    function describeTtsProvider(providerId) {
        switch (String(providerId || 'browser')) {
            case 'tiktok':
                return 'TikTok cần cookie phiên. Có thể dán Cookie header, JSON cookies hoặc Netscape cookie file.';
            case 'google':
                return 'Google Translate TTS chọn theo ngôn ngữ, không cần cookie riêng.';
            case 'gemini':
                return 'Gemini cần đăng nhập gemini.google.com trên trình duyệt hiện tại.';
            case 'bing':
                return 'Bing lấy token từ bing.com/translator, nên mở trang đó một lần nếu request lỗi token.';
            case 'zalo':
                return 'Zalo AI TTS cần một hoặc nhiều API key, mỗi dòng một key.';
            default:
                return 'Browser Web Speech dùng giọng có sẵn của trình duyệt/hệ điều hành.';
        }
    }

    let config = loadConfig();

    /* ================== GLOBAL STATE ================== */
    let translationCache = {};
    let isTranslating = false;
    let lastTranslationState = null; // { items, placeholderMaps, translatedResults }
    let hanvietMap = null;
    let lastSelectionRange = null;

    let selectionActionBar = null;
    let selectionActionLastActivation = 0;
    let selectionEditRefreshTimer = null;
    let simplifiedActive = false;
    let originalBodyElement = null; // Giữ body gốc để khôi phục không cần reload
    let originalScrollPosition = 0;
    let originalBodyClone = null; // Stores body before simplified view is enabled
    let translatedBodyClone = null;

    /* ================== VERSION ================== */
    const CURRENT_VERSION = '3.5.5.8_beta';
    const TM_VERSION_KEY = 'tm_translate_version';
    const TTS_STORAGE_KEY = 'twd_tts_reader_settings_v1';
    const TTS_DEFAULT_SETTINGS = {
        provider: 'browser',
        voiceURI: '',
        tiktokVoiceId: 'vi_female_huong',
        googleVoiceId: 'vi-VN',
        geminiVoiceId: 'vi-VN',
        bingVoiceId: 'vi-VN-HoaiMyNeural;Female',
        zaloVoiceId: '1',
        tiktokCookieText: '',
        zaloApiKeysText: '',
        prefetchEnabled: true,
        prefetchCount: 2,
        remoteTimeoutMs: 20000,
        remoteRetries: 2,
        remoteMinGapMs: 220,
        replaceEnabled: false,
        replaceRules: [],
        rate: 1,
        pitch: 1,
        volume: 1,
        maxChars: 260,
        segmentDelayMs: 250,
        autoNext: true,
        includeTitle: true,
        autoScroll: true,
        autoStartOnNextChapter: true,
        sleepTimerEnabled: false,
        sleepTimerMinutes: 30,
        panelCollapsed: false
    };
    const TTS_LIMITS = {
        rate: [0.5, 4],
        pitch: [0.7, 1.4],
        volume: [0, 1],
        maxChars: [80, 600],
        segmentDelayMs: [0, 5000],
        prefetchCount: [0, 6],
        remoteTimeoutMs: [3000, 60000],
        remoteRetries: [0, 5],
        remoteMinGapMs: [0, 2000],
        sleepTimerMinutes: [1, 240]
    };
    const TTS_SLEEP_FADE_OUT_MS = 5000;

    /* ================== SHADOW DOM ================== */
    // Tạo shadow host để cách ly UI khỏi CSS trang web
    const tmShadowHost = document.createElement('div');
    tmShadowHost.id = 'tm-translate-host';
    tmShadowHost.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;overflow:visible;z-index:2147483647;pointer-events:none;';
    document.documentElement.appendChild(tmShadowHost);
    const tmShadow = tmShadowHost.attachShadow({ mode: 'open' });

    // Container chứa tất cả UI elements
    const tmUIRoot = document.createElement('div');
    tmUIRoot.id = 'tm-ui-root';
    tmUIRoot.style.cssText = 'pointer-events:auto;';
    tmShadow.appendChild(tmUIRoot);

    // Helpers: tìm/xóa element trong shadow root
    function tmEl(id) { return tmUIRoot.querySelector('#' + id); }
    function tmRemoveEl(id) { const el = tmUIRoot.querySelector('#' + id); if (el) el.remove(); }

    /* ================== UTILITIES ================== */
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    function escapeHtml(s) {
        return String(s || '')
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    function escapeRegExp(s) {
        const input = String(s || '');
        let out = '';
        for (const ch of input) {
            const code = ch.charCodeAt(0);
            if (/^[\\^$.*+?()[\]{}|/]$/.test(ch)) {
                out += `\\${ch}`;
            } else if (ch === '\n') {
                out += '\\n';
            } else if (ch === '\r') {
                out += '\\r';
            } else if (ch === '\t') {
                out += '\\t';
            } else if (ch === '\f') {
                out += '\\f';
            } else if (ch === '\v') {
                out += '\\v';
            } else if (code < 0x20 || code === 0x7f) {
                out += `\\x${code.toString(16).padStart(2, '0')}`;
            } else if (ch === '\u2028' || ch === '\u2029') {
                out += `\\u${code.toString(16).padStart(4, '0')}`;
            } else if (/^[,\-=<>#&!%:;@~'"`]$/.test(ch)) {
                // These punctuators are invalid identity escapes with the Unicode flag.
                out += `\\x${code.toString(16).padStart(2, '0')}`;
            } else {
                out += ch;
            }
        }
        return out;
    }
    function createSafeRegExp(pattern, flags, context = '') {
        try {
            return new RegExp(pattern, flags);
        } catch (err) {
            console.warn('[tm-translate] Bỏ qua regex không hợp lệ.', {
                context,
                error: err?.message || String(err),
                pattern
            });
            return null;
        }
    }
    function createTranslatedNameBoundaryRegExp(canonical) {
        const escaped = escapeRegExp(canonical);
        return createSafeRegExp(
            `(^|[^\\p{L}\\p{N}\\p{M}])(${escaped})(?=$|[^\\p{L}\\p{N}\\p{M}])`,
            'giu',
            `name-boundary:${canonical}`
        ) || createSafeRegExp(
            `(^|[^A-Za-z0-9_À-ÖØ-öø-ÿĀ-žƀ-ɏ\\u0300-\\u036f])(${escaped})(?=$|[^A-Za-z0-9_À-ÖØ-öø-ÿĀ-žƀ-ɏ\\u0300-\\u036f])`,
            'gi',
            `name-boundary-fallback:${canonical}`
        );
    }
    function unescapeHtml(s) { return (s || '').toString().replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'); }
    function normalizeStraightQuotePairs(text) {
        if (typeof text !== 'string' || !text) return text || '';
        let result = '';
        let isInsideQuote = false;

        for (let i = 0; i < text.length; i++) {
            const ch = text[i];
            if (ch !== '"') {
                result += ch;
                continue;
            }

            if (!isInsideQuote) {
                const prev = result.slice(-1);
                if (prev && !/\s|[(\[{]/u.test(prev)) {
                    result += ' ';
                }
                result += '"';
                let nextIndex = i + 1;
                while (nextIndex < text.length && /\s/u.test(text[nextIndex])) nextIndex++;
                i = nextIndex - 1;
                isInsideQuote = true;
                continue;
            }

            result = result.replace(/\s+$/u, '');
            result += '"';
            let nextIndex = i + 1;
            while (nextIndex < text.length && /\s/u.test(text[nextIndex])) nextIndex++;
            if (nextIndex < text.length && /[\p{L}\p{N}\p{M}]/u.test(text[nextIndex])) {
                result += ' ';
            }
            i = nextIndex - 1;
            isInsideQuote = false;
        }

        return result;
    }
    function getActiveTranslatedNameValues() {
        try {
            const cfg = config || loadConfig();
            const activeSet = cfg?.nameSets?.[cfg.activeNameSet] || {};
            return Object.values(activeSet)
                .map(name => normalizeTextForTranslation(String(name || '')).trim())
                .filter(Boolean)
                .sort((a, b) => b.length - a.length);
        } catch (err) {
            return [];
        }
    }
    function isNameBoundaryChar(ch) {
        return !ch || !/[\p{L}\p{N}\p{M}]/u.test(ch);
    }
    function isTranslatedNameAt(text, index, names = getActiveTranslatedNameValues()) {
        if (!text || !names.length || index < 0) return false;
        const tail = text.slice(index);
        const before = text[index - 1] || '';
        if (!isNameBoundaryChar(before)) return false;
        for (const canonical of names) {
            const candidate = tail.slice(0, canonical.length);
            if (candidate.toLocaleLowerCase('vi-VN') !== canonical.toLocaleLowerCase('vi-VN')) continue;
            const after = tail[canonical.length] || '';
            if (isNameBoundaryChar(after)) return true;
        }
        return false;
    }
    function restoreTranslatedNameCasing(text, nameSet) {
        if (typeof text !== 'string' || !text) return text || '';
        // Name chính đã được thay bằng placeholder từ Trung -> Việt trước khi dịch.
        // Không quét lại Việt -> Việt, tránh lỗi kiểu "điều sơn" bị sửa thành "điềU sơn".
        return text;
    }
    function normalizeTranslatedTypography(s) {
        if (typeof s !== 'string' || !s) return s || '';
        let result = s;

        // dichngay đôi lúc để sót backslash trước dấu quote sau khi xử lý escape lỗi.
        result = result.replace(/\\+\s*(["”“‘’])/g, '$1');

        // Quote thẳng cần phân biệt mở/đóng theo cặp để không phá khoảng trắng bên ngoài.
        result = normalizeStraightQuotePairs(result);

        // Quote cong thì có thể chuẩn khoảng trắng bằng rule đơn giản hơn.
        result = result.replace(/([:;,])([“‘])/g, '$1 $2');
        result = result.replace(/(^|[\s([{:])([“‘])\s+/gu, '$1$2');
        result = result.replace(/(\S)\s+([”’])/gu, (match, prev, quote) => {
            return /[\p{L}\p{N}\p{M}.!?,…]/u.test(prev) ? `${prev}${quote}` : match;
        });
        result = result.replace(/([\p{L}\p{N}\p{M}.!?,…])([”’])(?=[\p{L}\p{N}\p{M}])/gu, '$1$2 ');

        // Quote đóng giữa câu thì từ theo sau thường không nên bị viết hoa.
        const protectedNames = getActiveTranslatedNameValues();
        result = result.replace(/([\p{L}\p{N}\p{M},;:])(["”’])(\s+)([\p{Lu}])/gu, (match, prev, quote, spaces, letter, offset, fullText) => {
            const letterIndex = offset + prev.length + quote.length + spaces.length;
            if (isTranslatedNameAt(fullText, letterIndex, protectedNames)) return match;
            return `${prev}${quote} ${letter.toLocaleLowerCase('vi-VN')}`;
        });

        return restoreTranslatedNameCasing(result).replace(/\s+/g, ' ').trim();
    }
    function capitalizeFirstLetter(s) {
        if (typeof s !== 'string' || !s) return s;
        const normalized = normalizeTranslatedTypography(s);
        return normalized.replace(/(^|[\.?!…:])(\s*["'“‘(\[]*)(\p{L})/gu, (match, p1, p2, p3) => {
            return p1 + p2 + p3.toLocaleUpperCase('vi-VN');
        });
    }
    const INVISIBLE_TEXT_FORMATTING_REGEX = /[\u00AD\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF]/;
    const INVISIBLE_TEXT_FORMATTING_GLOBAL_REGEX = /[\u00AD\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF]/g;
    const TOKEN_SPLIT_REGEX = /([^\p{L}\p{N}\p{M}\p{P}\s]+)/gu;
    const TOKEN_SPECIAL_REGEX = /^[^\p{L}\p{N}\p{M}\p{P}\s]+$/u;
    function hasInvisibleTextFormatting(s) {
        return typeof s === 'string' && INVISIBLE_TEXT_FORMATTING_REGEX.test(s);
    }
    function normalizeTextForTranslation(s) {
        if (typeof s !== 'string' || !s) return s || '';
        return s.replace(INVISIBLE_TEXT_FORMATTING_GLOBAL_REGEX, '');
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
        // CSS cho UI elements (dalam shadow root)
        if (!tmShadow.querySelector('#tm-shadow-styles')) {
            const uiCSS = `
        :host {
            --tm-primary: #007bff; --tm-dark: #343a40; --tm-light: #f8f9fa;
            --tm-white: #ffffff; --tm-border-color: #dee2e6; --tm-shadow: 0 8px 25px rgba(0,0,0,0.15);
            --tm-font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        #tm-ui-root {
            font-family: var(--tm-font);
            font-size: 14px;
            line-height: 1.5;
            color: var(--tm-dark);
        }
        .tm-float-btn {
            position: fixed; width: 48px; height: 48px; border-radius: 50%; color: var(--tm-white);
            display: flex; align-items: center; justify-content: center; z-index: 2147483640;
            cursor: pointer; box-shadow: var(--tm-shadow); transition: all 0.2s ease-in-out;
        }
        .tm-float-btn:hover { transform: scale(1.1); }
        #tm-selection-action-bar {
            position: fixed;
            z-index: 2147483661;
            background: rgba(33, 37, 41, 0.96);
            color: var(--tm-white);
            border-radius: 999px;
            padding: 5px;
            font-size: 12px;
            display: flex;
            align-items: center;
            gap: 4px;
            max-width: calc(100vw - 16px);
            overflow-x: auto;
            box-shadow: var(--tm-shadow);
            user-select: none;
            -webkit-user-select: none;
            -webkit-touch-callout: none;
            pointer-events: auto;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
        }
        #tm-selection-action-bar::-webkit-scrollbar { display: none; }
        .tm-selection-action-btn {
            border: 0;
            border-radius: 999px;
            min-height: 30px;
            padding: 5px 10px;
            background: transparent;
            color: inherit;
            cursor: pointer;
            white-space: nowrap;
            font: inherit;
            line-height: 1.1;
            user-select: none;
            -webkit-user-select: none;
            -webkit-touch-callout: none;
            touch-action: manipulation;
        }
        .tm-selection-action-btn:hover,
        .tm-selection-action-btn:focus-visible { background: rgba(255,255,255,0.14); outline: none; }
        .tm-selection-action-btn[data-action="edit"] { background: var(--tm-primary); }
        .tm-selection-action-btn[disabled] { opacity: 0.52; cursor: not-allowed; }
        #tm-selection-action-modal .tm-modal-box { width: min(520px, calc(100vw - 24px)); }
        .tm-selection-action-note {
            margin: 0 0 12px;
            color: var(--tm-secondary);
            font-size: 13px;
            line-height: 1.45;
        }
        .tm-selection-action-check {
            display: flex;
            align-items: center;
            gap: 8px;
            margin: 0 0 12px;
            font-size: 14px;
            font-weight: 500;
            user-select: none;
            -webkit-user-select: none;
        }
        .tm-selection-action-check input {
            width: 16px;
            height: 16px;
            margin: 0;
            accent-color: var(--tm-primary);
        }
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
        .tm-modal-content { padding: 20px; overflow-y: auto; color: var(--tm-dark); }
        .tm-modal-footer { padding: 12px 20px; border-top: 1px solid var(--tm-border-color); display: flex; justify-content: flex-end; gap: 8px; background-color: var(--tm-light); }
        .tm-btn { padding: 8px 16px; border-radius: 6px; border: 1px solid #ccc; background: #f7f7f7; cursor: pointer; transition: background 0.2s; font-size: 14px; }
        .tm-btn:hover { background: #e9e9e9; }
        .tm-btn-primary { background: var(--tm-primary); color: white; border-color: var(--tm-primary); }
        .tm-btn-primary:hover { background: #0056b3; }
        .tm-lib-export-recommended {
            position: relative; overflow: visible; padding-right: 22px; border-color: #f59e0b;
            background: linear-gradient(135deg, #fff7ed 0%, #eff6ff 100%); color: #1f2937; font-weight: 600;
        }
        .tm-lib-export-recommended:hover { background: linear-gradient(135deg, #ffedd5 0%, #dbeafe 100%); }
        .tm-lib-export-badge {
            position: absolute; top: -8px; right: -7px; padding: 1px 5px; border-radius: 999px;
            background: linear-gradient(90deg, #f97316, #ec4899); color: #fff; font-size: 9px; line-height: 1.25;
            box-shadow: 0 3px 8px rgba(236,72,153,0.28); pointer-events: none;
        }
        #tm-lib-list-modal {
            all: initial;
            position: fixed; inset: 0; z-index: 2147483661;
            display: flex; align-items: stretch; justify-content: stretch;
            width: 100vw; height: 100vh; height: 100dvh;
            font-family: var(--tm-font); font-size: 14px; line-height: 1.5;
            color: #172033; pointer-events: auto;
        }
        #tm-lib-list-modal,
        #tm-lib-list-modal * { box-sizing: border-box; }
        #tm-lib-list-modal button,
        #tm-lib-list-modal input {
            font: inherit; color: inherit; letter-spacing: 0; text-transform: none;
        }
        #tm-lib-list-modal button {
            -webkit-appearance: none; appearance: none; margin: 0;
            border-style: solid; text-align: center; touch-action: manipulation;
        }
        #tm-lib-list-modal input {
            margin: 0; min-width: 0; color: #172033;
        }
        #tm-lib-list-modal h2,
        #tm-lib-list-modal p { margin: 0; }
        #tm-lib-list-modal .tm-modal-backdrop { background: rgba(15,23,42,0.72); }
        .tm-library-shell {
            position: relative; z-index: 1; width: 100vw; height: 100vh; height: 100dvh;
            display: flex; flex-direction: column;
            background: #f6f7f9; color: #172033; overflow: hidden; font-family: var(--tm-font);
        }
        .tm-library-titleblock { min-width: 0; display: grid; gap: 2px; }
        .tm-library-titleblock h2 { margin: 0; font-size: 23px; line-height: 1.1; letter-spacing: 0; color: #111827; }
        .tm-library-muted { color: #64748b; font-size: 12px; line-height: 1.35; }
        .tm-library-close { flex: 0 0 auto; min-width: 38px; min-height: 34px; padding: 6px 10px; font-weight: 800; font-size: 18px; line-height: 1; }
        .tm-library-searchbox { position: relative; display: grid; gap: 6px; min-width: 0; }
        .tm-library-searchrow { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; }
        .tm-library-searchrow .tm-input { margin: 0; min-height: 38px; }
        .tm-library-filter-pop {
            position: absolute; top: calc(100% + 6px); right: 0; z-index: 8; width: min(260px, 84vw);
            padding: 10px; border: 1px solid #d8dde6; border-radius: 10px; background: #fff;
            box-shadow: 0 14px 34px rgba(15,23,42,0.16); display: none;
        }
        .tm-library-filter-pop.open { display: grid; gap: 8px; }
        .tm-library-check { display: flex; align-items: center; gap: 8px; color: #334155; font-size: 13px; }
        .tm-library-toolbar { display: flex; align-items: center; justify-content: flex-end; gap: 10px; flex-wrap: wrap; }
        .tm-library-backup-status {
            max-width: min(34vw, 300px); padding: 5px 9px; border: 1px solid #d8dde6; border-radius: 999px;
            background: #fff; color: #475569; font-size: 12px; line-height: 1.25; white-space: nowrap;
            overflow: hidden; text-overflow: ellipsis;
        }
        .tm-library-menu-wrap { position: relative; flex: 0 0 auto; }
        .tm-library-menu-btn { min-width: 38px; min-height: 34px; padding: 6px 10px; font-size: 18px; line-height: 1; font-weight: 800; }
        .tm-library-menu {
            position: absolute; right: 0; top: calc(100% + 8px); z-index: 10; width: min(280px, 86vw);
            display: none; grid-template-columns: 1fr; gap: 7px; padding: 10px; border: 1px solid #d8dde6;
            border-radius: 10px; background: #fff; box-shadow: 0 16px 38px rgba(15,23,42,0.18);
        }
        .tm-library-menu.open { display: grid; }
        .tm-library-menu .tm-btn { width: 100%; min-height: 36px; text-align: left; }
        .tm-library-menu-row { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
        .tm-library-menu-row .tm-btn { text-align: center; }
        .tm-library-main { flex: 1 1 auto; min-width: 0; min-height: 0; display: flex; flex-direction: column; overflow: hidden; }
        .tm-library-topbar {
            flex: 0 0 auto; display: grid; grid-template-columns: minmax(180px, 0.7fr) minmax(280px, 1.2fr) auto;
            align-items: center; gap: 12px; padding: 14px 22px; border-bottom: 1px solid #d8dde6;
            background: rgba(246,247,249,0.92);
        }
        .tm-library-result-meta { font-size: 12px; color: #64748b; }
        .tm-library-load-hint { max-width: min(24vw, 280px); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .tm-library-scroll { flex: 1 1 auto; min-height: 0; overflow: auto; padding: 18px 22px 30px; }
        .tm-library-grid {
            display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 14px;
            align-items: stretch;
        }
        .tm-library-card {
            display: grid; grid-template-columns: 82px minmax(0, 1fr); gap: 12px; min-height: 146px;
            padding: 10px; border: 1px solid #d8dde6; border-radius: 8px; background: #fff;
            box-shadow: 0 8px 20px rgba(15,23,42,0.05);
        }
        .tm-library-cover-wrap { position: relative; width: 82px; min-width: 82px; }
        .tm-library-cover {
            width: 82px; height: 120px; object-fit: cover; border-radius: 6px; border: 1px solid #cbd5e1;
            background: #e2e8f0; display: block;
        }
        .tm-library-cover-btn {
            width: 100%; min-height: 24px; margin-top: 6px; padding: 3px 5px; font-size: 11px;
        }
        .tm-library-card-main { min-width: 0; display: flex; flex-direction: column; gap: 7px; }
        .tm-library-title { font-weight: 800; font-size: 15px; line-height: 1.25; color: #111827; overflow-wrap: anywhere; }
        .tm-library-author, .tm-library-meta, .tm-library-progress { font-size: 12px; line-height: 1.35; color: #64748b; }
        .tm-library-progress { color: #334155; }
        .tm-library-card-actions { display: flex; gap: 6px; flex-wrap: wrap; margin-top: auto; }
        .tm-library-card-actions .tm-btn { min-height: 28px; padding: 5px 8px; font-size: 12px; }
        .tm-library-empty {
            padding: 36px 16px; border: 1px dashed #cbd5e1; border-radius: 10px; text-align: center;
            color: #64748b; background: #fff;
        }
        .tm-library-loadmore { margin: 18px auto 0; display: block; min-width: 160px; }
        .tm-library-loadmore[hidden], .tm-library-load-hint[hidden] { display: none !important; }
        @media (max-width: 860px) {
            .tm-library-titleblock h2 { font-size: 21px; }
            .tm-library-close { min-width: 34px; min-height: 34px; padding: 5px 8px; }
            .tm-library-searchbox { gap: 6px; }
            .tm-library-searchrow { gap: 6px; }
            .tm-library-searchrow .tm-input { min-height: 36px; padding: 6px 10px; font-size: 13px; }
            .tm-library-searchrow .tm-btn { min-height: 36px; padding: 6px 10px; }
            .tm-library-toolbar { justify-content: flex-end; gap: 6px; flex-wrap: nowrap; }
            .tm-library-backup-status { max-width: 96px; padding: 4px 8px; font-size: 11px; }
            .tm-library-menu-btn { min-width: 34px; min-height: 32px; padding: 5px 9px; }
            .tm-library-menu { right: 0; }
            .tm-library-topbar {
                grid-template-columns: minmax(0, 1fr) auto; align-items: start; gap: 8px; padding: 9px 12px;
            }
            .tm-library-searchbox { grid-column: 1 / -1; grid-row: 2; }
            .tm-library-filter-pop { left: 0; right: auto; width: min(320px, calc(100vw - 24px)); }
            .tm-library-load-hint { max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .tm-library-scroll { padding: 12px; }
            .tm-library-grid { grid-template-columns: 1fr; }
            .tm-library-card { grid-template-columns: 70px minmax(0, 1fr); min-height: 126px; gap: 10px; padding: 8px; }
            .tm-library-cover-wrap { width: 70px; min-width: 70px; }
            .tm-library-cover { width: 70px; height: 102px; }
            .tm-library-cover-btn { min-height: 22px; padding: 2px 4px; font-size: 10px; }
            .tm-library-title { font-size: 14px; }
            .tm-library-author, .tm-library-meta, .tm-library-progress { font-size: 11px; }
            .tm-library-card-actions .tm-btn { min-height: 26px; padding: 4px 7px; font-size: 11px; }
        }
        @media (max-width: 560px) {
            .tm-library-load-hint { display: none; }
            .tm-library-backup-status { max-width: 90px; }
        }
        .tm-input, .tm-select, .tm-textarea { width: 100%; padding: 8px 12px; border: 1px solid var(--tm-border-color); border-radius: 6px; margin-top: 4px; margin-bottom: 12px; box-sizing: border-box; font-size: 14px; }
        .tm-label { font-weight: 600; font-size: 14px; display: block; margin-bottom: 4px; }
        .tm-row { display: flex; gap: 16px; }
        .tm-col { flex: 1; }
        .tm-tabs-nav { display: flex; border-bottom: 1px solid var(--tm-border-color); background: var(--tm-light); }
        .tm-tab-btn { padding: 12px 20px; cursor: pointer; border: none; background: none; font-size: 15px; color: var(--tm-dark); }
        .tm-tab-btn.active { background: var(--tm-white); border-bottom: 3px solid var(--tm-primary); }
        .tm-tab-content { display: none; }
        .tm-tab-content.active { display: block; }
        #tm-style-panel .tm-modal-box { width: 340px; }
        .tm-bg-swatch { width: 32px; height: 32px; border: 1px solid #ddd; cursor: pointer; border-radius: 50%; transition: transform 0.2s; }
        .tm-bg-swatch:hover { transform: scale(1.1); }
        .tm-bg-swatch.active { box-shadow: 0 0 0 3px var(--tm-primary); }
        .tm-preview-box { border: 1px solid var(--tm-border-color); padding: 8px; min-height: 200px; max-height: 400px; overflow: auto; background: #fafafa; border-radius: 6px; color: var(--tm-dark); }
        #tm-loading-indicator { position: fixed; top: 10px; left: 50%; transform: translateX(-50%); background: var(--tm-dark); color: white; padding: 10px 20px; border-radius: 8px; z-index: 2147483647; font-size: 16px; box-shadow: var(--tm-shadow); }
        #tm-notification-bubble { position: fixed; top: 20px; right: 20px; background-color: #2c3e50; color: white; padding: 10px 18px; border-radius: 25px; z-index: 2147483647; font-size: 14px; box-shadow: var(--tm-shadow); }
        /* Help/Welcome Modal */
        .tm-help-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 2147483650; }
        .tm-help-modal {
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            width: 640px; max-width: 92vw; max-height: 82vh;
            background: linear-gradient(135deg, #fff7fb 0%, #f2f8ff 100%);
            border-radius: 14px; border: 1px solid rgba(0,0,0,0.06);
            box-shadow: 0 18px 40px rgba(63, 81, 181, 0.25);
            z-index: 2147483651; display: flex; flex-direction: column;
            color: #222; font-family: var(--tm-font); font-size: 14px;
        }
        .tm-help-header {
            padding: 12px 16px; font-size: 16px; font-weight: 600;
            border-bottom: 1px solid rgba(0,0,0,0.06);
            background: linear-gradient(90deg, #fce4ec, #e3f2fd);
            border-radius: 14px 14px 0 0;
            display: flex; align-items: center; justify-content: space-between; gap: 10px;
        }
        .tm-help-content { padding: 14px 16px; overflow-y: auto; line-height: 1.55; }
        .tm-help-content h3 { margin: 12px 0 6px; font-size: 15px; color: #6a1b9a; }
        .tm-help-content code { background: #fff0f6; padding: 1px 4px; border-radius: 4px; }
        .tm-help-content a { color: #0b63ce; text-decoration: underline; font-weight: 600; }
        .tm-help-content a:hover { color: #084aa0; }
        .tm-help-content ul { padding-left: 20px; margin: 6px 0 12px; }
        .tm-help-close { padding: 4px 10px; font-size: 12px; min-height: unset; width: auto; }
        .tm-welcome-title { text-align: center; font-size: 18px; font-weight: 700; color: #7b1fa2; }
        .tm-welcome-sub { text-align: center; margin: 6px 0 10px 0; color: #6a5b9a; }
        .tm-welcome-banner { background: linear-gradient(135deg, #fce4ec, #e3f2fd); padding: 10px; border-radius: 10px; border-left: 4px solid #ec407a; }
        .tm-update-banner { margin: 8px 0 12px; padding: 10px 12px; border-radius: 12px; background: linear-gradient(135deg, #ffe7f3 0%, #e8f3ff 100%); border: 1px solid rgba(255, 143, 194, 0.4); }
        .tm-update-banner strong { color: #7a1d5a; }
        .tm-hide { display: none !important; }
        `;
            const shadowStyle = document.createElement('style');
            shadowStyle.id = 'tm-shadow-styles';
            shadowStyle.textContent = uiCSS;
            tmShadow.insertBefore(shadowStyle, tmShadow.firstChild);
        }

        // CSS cho page (simplified view, reader overlay) - giữ trên document.head
        if (document.getElementById('tm-global-styles')) return;
        const pageCSS = `
        #tm-simplified-container { padding: 30px 5%; min-height: 100vh; box-sizing: border-box; }
        #tm-simplified-container p { margin-bottom: 1.2em; }
        #tm-simplified-topbar { max-width: 800px; margin: 0 auto 24px auto; display: flex; justify-content: space-between; align-items: center; padding-bottom: 16px; border-bottom: 1px solid rgba(128,128,128,0.3); }
        .tm-reader-overlay {
            position: fixed; inset: 0; z-index: 2147483646; width: 100vw; height: 100vh; height: 100dvh;
            max-width: 100vw; max-height: 100dvh; overflow: hidden; display: flex; flex-direction: column;
            background:
                radial-gradient(circle at 8% 0%, color-mix(in srgb, var(--tm-reader-text, #1f1f1f) 7%, transparent), transparent 34%),
                radial-gradient(circle at 92% 8%, color-mix(in srgb, var(--tm-reader-text, #1f1f1f) 5%, transparent), transparent 36%),
                var(--tm-reader-bg, #f7f4ee);
            color: var(--tm-reader-text, #1f1f1f);
            font-family: var(--tm-reader-font, "Noto Serif", "Times New Roman", serif);
            --tm-reader-safe-top: env(safe-area-inset-top, 0px);
            --tm-reader-safe-right: env(safe-area-inset-right, 0px);
            --tm-reader-safe-bottom: env(safe-area-inset-bottom, 0px);
            --tm-reader-safe-left: env(safe-area-inset-left, 0px);
        }
        .tm-reader-overlay, .tm-reader-overlay * { box-sizing: border-box; }
        .tm-reader-header, .tm-reader-footer {
            flex: 0 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 8px;
            margin: 6px; padding: 7px 10px; border: 1px solid var(--tm-reader-border, rgba(0,0,0,0.12));
            border-radius: 12px; background: color-mix(in srgb, var(--tm-reader-surface, #fbf9f4) 82%, transparent);
            backdrop-filter: blur(10px); box-shadow: 0 8px 22px rgba(0,0,0,0.08);
        }
        .tm-reader-header { align-items: flex-start; padding-top: max(7px, calc(var(--tm-reader-safe-top) + 5px)); }
        .tm-reader-title { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
        .tm-reader-book { overflow-wrap: anywhere; word-break: break-word; font-size: clamp(18px, 2.1vw, 26px); line-height: 1.16; font-weight: 800; }
        .tm-reader-chapter { font-size: 12px; color: var(--tm-reader-muted, #5c5c5c); }
        .tm-reader-actions { display: flex; align-items: center; justify-content: flex-end; flex-wrap: wrap; gap: 5px; min-width: 0; }
        .tm-reader-overlay .tm-btn {
            min-height: 30px; padding: 5px 10px; border-radius: 999px; border: 1px solid var(--tm-reader-border, #ccc);
            background: color-mix(in srgb, var(--tm-reader-surface, #fbf9f4) 72%, transparent);
            color: var(--tm-reader-text, #1f1f1f); cursor: pointer; font-size: 12px; line-height: 1.1;
            touch-action: manipulation; -webkit-tap-highlight-color: transparent;
        }
        .tm-reader-overlay .tm-btn:hover { background: var(--tm-reader-hover, rgba(0,0,0,0.06)); }
        .tm-reader-overlay .tm-btn.active { background: var(--tm-reader-text, #222); color: var(--tm-reader-bg, #fff); border-color: var(--tm-reader-text, #222); }
        .tm-reader-overlay .tm-btn:disabled { opacity: 0.42; cursor: not-allowed; }
        .tm-reader-close-btn { min-width: 44px; font-weight: 800; }
        .tm-reader-body { flex: 1 1 auto; min-height: 0; display: flex; padding: 0 6px; overflow: hidden; }
        .tm-reader-viewport { flex: 1 1 auto; min-width: 0; min-height: 0; display: flex; flex-direction: column; position: relative; }
        .tm-reader-content {
            flex: 1 1 auto; min-height: 0; overflow-y: auto; -webkit-overflow-scrolling: touch; overscroll-behavior: contain;
            padding: clamp(12px, 2vw, 20px) var(--tm-reader-padding-x, 18px);
            border: 1px solid color-mix(in srgb, var(--tm-reader-border, #ccc) 70%, transparent);
            border-radius: 12px; background: color-mix(in srgb, var(--tm-reader-surface, #fbf9f4) 18%, transparent);
            scroll-behavior: smooth;
            -webkit-user-select: text; user-select: text;
        }
        .tm-reader-content, .tm-reader-content * { -webkit-touch-callout: none; }
        .tm-reader-text, .tm-reader-block-text, .tm-reader-text *, .tm-reader-block-text * { -webkit-user-select: text; user-select: text; }
        .tm-reader-header, .tm-reader-footer, .tm-reader-toc-drawer, .tm-reader-mini-head, .tm-reader-mini-foot { -webkit-user-select: none; user-select: none; }
        .tm-reader-content h2 { width: 100%; margin: 0 0 12px; font-size: clamp(20px, 3vw, 28px); line-height: 1.22; }
        .tm-reader-text { width: 100%; margin: 0; white-space: pre-wrap; font-size: var(--tm-reader-font-size, 18px); line-height: var(--tm-reader-line-height, 1.9); text-align: var(--tm-reader-text-align, justify); }
        .tm-reader-text p, .tm-reader-block-text p { margin: 0 0 var(--tm-reader-paragraph-spacing, 12px) 0; text-indent: var(--tm-reader-text-indent, 0em); }
        .tm-reader-text p:last-child, .tm-reader-block-text p:last-child { margin-bottom: 0; }
        .tm-reader-block { width: 100%; margin: 0 0 22px; }
        .tm-reader-sep { margin: 16px 0 8px; text-align: center; color: var(--tm-reader-muted, #6b6b6b); font-size: 12px; }
        .tm-reader-block-title { margin: 0 0 12px 0; font-size: clamp(20px, 3vw, 28px); line-height: 1.28; font-weight: 800; text-align: var(--tm-reader-text-align, justify); }
        .tm-reader-block-text { white-space: pre-wrap; font-size: var(--tm-reader-font-size, 18px); line-height: var(--tm-reader-line-height, 1.9); text-align: var(--tm-reader-text-align, justify); }
        .tm-reader-spacer { height: var(--tm-reader-spacer, 120px); display: flex; align-items: center; justify-content: center; color: var(--tm-reader-muted, #6b6b6b); font-size: 12px; text-align: center; }
        .tm-reader-footer { padding-bottom: max(7px, calc(var(--tm-reader-safe-bottom) + 5px)); }
        .tm-reader-footer .tm-btn { min-width: min(128px, 34vw); }
        .tm-reader-progress { min-width: 110px; text-align: center; font-size: 12px; color: var(--tm-reader-muted, #5c5c5c); }
        .tm-reader-no-translate #tm-reader-raw-btn,
        .tm-reader-no-translate #tm-reader-trans-btn { display: none; }
        .tm-reader-tts-segment {
            border-radius: 5px;
            transition: background 0.18s ease, box-shadow 0.18s ease;
        }
        .tm-reader-tts-active {
            background: color-mix(in srgb, #ffd66b 46%, transparent);
            box-shadow: 0 0 0 2px color-mix(in srgb, #ffd66b 42%, transparent);
        }
        .tm-reader-tts-player {
            position: fixed;
            right: max(12px, var(--tm-reader-safe-right));
            bottom: max(74px, calc(var(--tm-reader-safe-bottom) + 62px));
            z-index: 2147483654;
            width: min(360px, calc(100vw - 24px));
            min-height: 86px;
            padding: 10px;
            display: none;
            align-items: center;
            gap: 10px;
            border: 1px solid color-mix(in srgb, var(--tm-reader-border, #ccc) 72%, transparent);
            border-radius: 16px;
            background: color-mix(in srgb, var(--tm-reader-surface, #fbf9f4) 90%, transparent);
            color: var(--tm-reader-text, #1f1f1f);
            box-shadow: 0 18px 46px rgba(0,0,0,0.18);
            backdrop-filter: blur(18px);
            font-family: var(--tm-reader-font, "Noto Serif", "Times New Roman", serif);
            user-select: none;
            -webkit-user-select: none;
        }
        .tm-reader-tts-player.open { display: flex; }
        .tm-reader-tts-disc {
            flex: 0 0 auto;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background:
                radial-gradient(circle at center, var(--tm-reader-surface, #fbf9f4) 0 16%, transparent 17%),
                conic-gradient(from 30deg, var(--tm-reader-text, #222), var(--tm-reader-muted, #777), var(--tm-reader-text, #222));
            box-shadow: inset 0 0 0 7px color-mix(in srgb, var(--tm-reader-bg, #f7f4ee) 55%, transparent), 0 8px 20px rgba(0,0,0,0.16);
        }
        .tm-reader-tts-player.playing .tm-reader-tts-disc { animation: tm-reader-tts-spin 1.6s linear infinite; }
        .tm-reader-tts-player.paused .tm-reader-tts-disc { opacity: 0.72; }
        @keyframes tm-reader-tts-spin { to { transform: rotate(360deg); } }
        .tm-reader-tts-main { min-width: 0; flex: 1 1 auto; display: flex; flex-direction: column; gap: 6px; }
        .tm-reader-tts-title { min-width: 0; font-size: 12px; line-height: 1.25; font-weight: 800; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .tm-reader-tts-meta { min-width: 0; display: flex; justify-content: space-between; gap: 8px; color: var(--tm-reader-muted, #666); font-size: 11px; line-height: 1.25; }
        .tm-reader-tts-status { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .tm-reader-tts-time { flex: 0 0 auto; font-variant-numeric: tabular-nums; }
        .tm-reader-tts-controls { display: flex; align-items: center; gap: 6px; }
        .tm-reader-tts-controls .tm-btn { min-height: 28px; padding: 4px 9px; font-size: 11px; }
        .tm-reader-backdrop {
            position: fixed; inset: 0; z-index: 2147483650; background: rgba(0,0,0,0.38);
            opacity: 0; pointer-events: none; transition: opacity 0.18s ease;
        }
        .tm-reader-backdrop.open { opacity: 1; pointer-events: auto; }
        .tm-reader-toc-drawer {
            position: fixed; top: 0; bottom: 0; left: 0; z-index: 2147483651; width: min(360px, 88vw);
            display: flex; flex-direction: column; min-height: 0; overflow: hidden;
            border-right: 1px solid var(--tm-reader-border, rgba(0,0,0,0.12));
            background: color-mix(in srgb, var(--tm-reader-surface, #fbf9f4) 96%, transparent);
            color: var(--tm-reader-text, #1f1f1f); backdrop-filter: blur(14px);
            box-shadow: 12px 0 32px rgba(0,0,0,0.18); transform: translateX(-102%);
            transition: transform 0.22s ease;
        }
        .tm-reader-toc-drawer.open { transform: translateX(0); }
        .tm-reader-drawer-head {
            flex: 0 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 10px;
            padding: max(12px, calc(var(--tm-reader-safe-top) + 10px)) 14px 12px;
            border-bottom: 1px solid var(--tm-reader-border, rgba(0,0,0,0.12)); background: inherit;
        }
        .tm-reader-drawer-head h3 { margin: 0; font-size: 16px; }
        .tm-reader-toc-list { flex: 1 1 auto; min-height: 0; overflow-y: auto; padding: 8px; }
        .tm-reader-toc-item { padding: 11px 12px; cursor: pointer; border: 1px solid transparent; border-radius: 12px; font-size: 14px; line-height: 1.35; }
        .tm-reader-toc-item:hover { background: var(--tm-reader-hover, rgba(0,0,0,0.04)); }
        .tm-reader-toc-item.active { background: var(--tm-reader-active, rgba(0,0,0,0.08)); border-color: var(--tm-reader-border, rgba(0,0,0,0.12)); font-weight: 700; }
        .tm-reader-mini-head, .tm-reader-mini-foot {
            position: fixed; left: 0; right: 0;
            z-index: 2147483649; display: flex; align-items: center; gap: 10px;
            border: 1px solid color-mix(in srgb, var(--tm-reader-border, #ccc) 70%, transparent);
            background: color-mix(in srgb, var(--tm-reader-surface, #fbf9f4) 76%, transparent);
            color: var(--tm-reader-muted, #5c5c5c); backdrop-filter: blur(8px); pointer-events: none;
            box-shadow: 0 8px 18px rgba(0,0,0,0.12);
        }
        .tm-reader-mini-head[hidden], .tm-reader-mini-foot[hidden] { display: none !important; }
        .tm-reader-mini-head {
            top: 0; padding: max(2px, var(--tm-reader-safe-top)) max(9px, var(--tm-reader-safe-right)) 3px max(9px, var(--tm-reader-safe-left));
            border-top: 0; border-radius: 0 0 12px 12px;
        }
        .tm-reader-mini-foot {
            bottom: 0; justify-content: space-between;
            padding: 3px max(9px, var(--tm-reader-safe-right)) max(2px, var(--tm-reader-safe-bottom)) max(9px, var(--tm-reader-safe-left));
            border-bottom: 0; border-radius: 12px 12px 0 0;
        }
        .tm-reader-mini-title { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11px; color: var(--tm-reader-text, #1f1f1f); }
        .tm-reader-mini-item { white-space: nowrap; font-size: 11px; }
        .tm-reader-mini-right { display: flex; align-items: center; justify-content: flex-end; gap: 10px; }
        .tm-reader-fullscreen .tm-reader-body { padding: 0; }
        .tm-reader-fullscreen .tm-reader-content {
            border-radius: 0; border-left: 0; border-right: 0; border-bottom: 0;
            padding: max(16px, calc(var(--tm-reader-safe-top) + 12px)) var(--tm-reader-padding-x, 18px) max(24px, calc(var(--tm-reader-safe-bottom) + 16px));
            background: color-mix(in srgb, var(--tm-reader-surface, #fbf9f4) 12%, transparent);
        }
        .tm-reader-fullscreen .tm-reader-header, .tm-reader-fullscreen .tm-reader-footer {
            position: fixed; left: max(8px, var(--tm-reader-safe-left)); right: max(8px, var(--tm-reader-safe-right));
            z-index: 2147483653; margin: 0; transition: opacity 0.18s ease, transform 0.18s ease;
        }
        .tm-reader-fullscreen .tm-reader-header { top: max(8px, var(--tm-reader-safe-top)); }
        .tm-reader-fullscreen .tm-reader-footer { bottom: max(8px, var(--tm-reader-safe-bottom)); }
        .tm-reader-fullscreen:not(.tm-reader-fullscreen-ui-visible) .tm-reader-header { opacity: 0; transform: translateY(-12px); pointer-events: none; }
        .tm-reader-fullscreen:not(.tm-reader-fullscreen-ui-visible) .tm-reader-footer { opacity: 0; transform: translateY(12px); pointer-events: none; }
        .tm-reader-fullscreen.tm-reader-mini-visible .tm-reader-content { padding-top: max(44px, calc(var(--tm-reader-safe-top) + 38px)); padding-bottom: max(52px, calc(var(--tm-reader-safe-bottom) + 44px)); }
        .tm-reader-overlay * { scrollbar-width: thin; scrollbar-color: var(--tm-reader-border, #999) transparent; }
        .tm-reader-overlay ::-webkit-scrollbar { width: 10px; height: 10px; }
        .tm-reader-overlay ::-webkit-scrollbar-track { background: transparent; }
        .tm-reader-overlay ::-webkit-scrollbar-thumb {
            background: color-mix(in srgb, var(--tm-reader-text, #555) 30%, transparent);
            border-radius: 8px; border: 2px solid transparent; background-clip: padding-box;
        }
        .tm-reader-overlay ::-webkit-scrollbar-thumb:hover {
            background: color-mix(in srgb, var(--tm-reader-text, #555) 45%, transparent);
        }
        @media (max-width: 760px) {
            .tm-reader-header { margin: 4px; padding: max(6px, calc(var(--tm-reader-safe-top) + 4px)) 7px 7px; flex-direction: column; align-items: stretch; }
            .tm-reader-actions { width: 100%; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 5px; }
            .tm-reader-actions .tm-btn { width: 100%; min-height: 30px; padding: 5px 6px; font-size: 11px; }
            .tm-reader-book { font-size: 17px; }
            .tm-reader-body { padding: 0; }
            .tm-reader-content { border-left: 0; border-right: 0; border-radius: 0; padding: 12px var(--tm-reader-padding-x, 12px); }
            .tm-reader-footer { margin: 4px; display: grid; grid-template-columns: 1fr 1fr; padding: 6px 7px max(6px, calc(var(--tm-reader-safe-bottom) + 4px)); }
            .tm-reader-progress { grid-column: 1 / -1; order: -1; width: 100%; font-size: 11px; }
            .tm-reader-footer .tm-btn { width: 100%; min-width: 0; }
            .tm-reader-toc-drawer { width: 100vw; max-width: 100vw; }
            .tm-reader-mini-head, .tm-reader-mini-foot { gap: 6px; }
            .tm-reader-mini-head { padding: max(2px, var(--tm-reader-safe-top)) max(6px, var(--tm-reader-safe-right)) 2px max(6px, var(--tm-reader-safe-left)); }
            .tm-reader-mini-foot { padding: 2px max(6px, var(--tm-reader-safe-right)) max(2px, var(--tm-reader-safe-bottom)) max(6px, var(--tm-reader-safe-left)); }
            .tm-reader-mini-title, .tm-reader-mini-item { font-size: 10px; }
            .tm-reader-fullscreen .tm-reader-header, .tm-reader-fullscreen .tm-reader-footer { left: max(4px, var(--tm-reader-safe-left)); right: max(4px, var(--tm-reader-safe-right)); border-radius: 10px; }
            .tm-reader-tts-player {
                right: max(8px, var(--tm-reader-safe-right));
                left: max(8px, var(--tm-reader-safe-left));
                bottom: max(82px, calc(var(--tm-reader-safe-bottom) + 70px));
                width: auto;
                min-height: 78px;
                border-radius: 14px;
            }
            .tm-reader-tts-disc { width: 42px; height: 42px; }
        }
        @media (max-width: 420px) {
            .tm-reader-actions { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .tm-reader-chapter { font-size: 12px; }
            .tm-reader-text, .tm-reader-block-text { text-align: left; }
        }
        `;
        const styleEl = document.createElement('style');
        styleEl.id = 'tm-global-styles';
        styleEl.textContent = pageCSS;
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
        tmUIRoot.appendChild(div);
    }
    function removeLoading() {
        tmRemoveEl('tm-loading-indicator');
    }

    function updateFloatingButtons() {
        removeElementById('tm-start-translate-btn');
        removeElementById('tm-edit-pencil');
        removeElementById('tm-style-button');
        removeElementById('tm-quick-translate-btn');
        removeElementById('tm-restore-original-btn');
        removeElementById('tm-ocr-float-btn');
        removeElementById('tm-library-btn');
        removeElementById('tm-help-float-btn');
        removeStylePanel();

        let bottomOffset = 18;

        if (config.showQuickTranslateButton) {
            const quickBtn = document.createElement('div');
            quickBtn.id = 'tm-quick-translate-btn';
            quickBtn.className = 'tm-float-btn';
            quickBtn.title = 'Bảng dịch nhanh';
            quickBtn.style.right = '18px';
            quickBtn.style.bottom = `${bottomOffset}px`;
            quickBtn.style.backgroundColor = '#6c757d';
            quickBtn.innerHTML = ttHTML(`<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 11H7V9h2v2zm4 0h-2V9h2v2zm4 0h-2V9h2v2z"/></svg>`);
            quickBtn.addEventListener('click', showQuickTranslatePanel);
            tmUIRoot.appendChild(quickBtn);
            bottomOffset += 64;
        }

        if (config.showOcrButton) {
            const ocrBtn = document.createElement('div');
            ocrBtn.id = 'tm-ocr-float-btn';
            ocrBtn.className = 'tm-float-btn';
            ocrBtn.title = 'OCR Vùng chọn (Dịch hình ảnh)';
            ocrBtn.style.right = '18px';
            ocrBtn.style.bottom = `${bottomOffset}px`;
            ocrBtn.style.backgroundColor = '#17a2b8';
            ocrBtn.innerHTML = ttHTML(`<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8V6a2 2 0 0 1 2-2h2"/><path d="M4 16v2a2 2 0 0 0 2 2h2"/><path d="M16 4h2a2 2 0 0 1 2 2v2"/><path d="M16 20h2a2 2 0 0 0 2-2v-2"/><path d="M10 10l4 4m0-4l-4 4"/></svg>`);
            ocrBtn.addEventListener('click', handleOcrButtonClick);
            tmUIRoot.appendChild(ocrBtn);
            bottomOffset += 64;
        }

        if (config.showLibraryButton) {
            const libBtn = document.createElement('div');
            libBtn.id = 'tm-library-btn';
            libBtn.className = 'tm-float-btn';
            libBtn.title = 'Thư viện';
            libBtn.style.right = '18px';
            libBtn.style.bottom = `${bottomOffset}px`;
            libBtn.style.backgroundColor = '#20c997';
            libBtn.innerHTML = ttHTML(`<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M3 5.5C3 4.12 4.12 3 5.5 3H20v16h-1.5a2.5 2.5 0 0 0 0 5H20v1H5.5C4.12 25 3 23.88 3 22.5v-17zM5.5 5a.5.5 0 0 0-.5.5v17a.5.5 0 0 0 .5.5H18a1.5 1.5 0 0 1 0-3H5.5a.5.5 0 0 1-.5-.5v-14A.5.5 0 0 1 5.5 5H18V4H5.5z"/></svg>`);
            libBtn.addEventListener('click', openLibraryListModal);
            tmUIRoot.appendChild(libBtn);
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
            startBtn.innerHTML = ttHTML(`<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><text x="12" y="17" text-anchor="middle" font-size="18" font-weight="bold" font-family="Arial,sans-serif">D</text></svg>`);
            startBtn.addEventListener('click', startTranslateAction);
            tmUIRoot.appendChild(startBtn);
            bottomOffset += 64;
        } else if (translatedBodyClone && config.nameEditingEnabled) {

            const pencil = document.createElement('div');
            pencil.id = 'tm-edit-pencil';
            pencil.className = 'tm-float-btn';
            pencil.title = 'Sửa tên (chọn chữ rồi bấm)';
            pencil.style.right = '18px';
            pencil.style.bottom = `${bottomOffset}px`;
            pencil.innerHTML = ttHTML(`<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`);
            pencil.addEventListener('mousedown', () => {
                const sel = window.getSelection();
                if (sel.rangeCount > 0) lastSelectionRange = sel.getRangeAt(0).cloneRange();
            });
            pencil.addEventListener('click', (event) => {
                event.preventDefault();
                openEditModalForSelection();
            });
            tmUIRoot.appendChild(pencil);
            bottomOffset += 64;
        }

        if (translatedBodyClone && !simplifiedActive && config.showRestoreButton !== false) {
            const restoreBtn = document.createElement('div');
            restoreBtn.id = 'tm-restore-original-btn';
            restoreBtn.className = 'tm-float-btn';
            restoreBtn.title = 'Quay về trang gốc';
            restoreBtn.style.right = '18px';
            restoreBtn.style.top = '18px';
            restoreBtn.style.backgroundColor = '#ffc107';
            restoreBtn.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M5 11h10l-3.29-3.29L13.12 6.3 19 12l-5.88 5.7-1.41-1.41L15 13H5z"/></svg>`;
            restoreBtn.addEventListener('click', restoreOriginalPage);
            tmUIRoot.appendChild(restoreBtn);
        }

        if (simplifiedActive) {
            const styleBtn = document.createElement('div');
            styleBtn.id = 'tm-style-button';
            styleBtn.className = 'tm-float-btn';
            styleBtn.title = 'Tùy chỉnh Giao diện đọc';
            styleBtn.style.right = '18px';
            styleBtn.style.bottom = `${bottomOffset}px`;
            styleBtn.style.backgroundColor = '#343a40';
            styleBtn.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18M5 7h14M5 17h14"/></svg>`;
            styleBtn.addEventListener('click', toggleStylePanel);
            tmUIRoot.appendChild(styleBtn);
        }

        // Nút ? Hướng dẫn (góc trái trên)
        if (config.showHelpButton) {
            const helpBtn = document.createElement('div');
            helpBtn.id = 'tm-help-float-btn';
            helpBtn.className = 'tm-float-btn';
            helpBtn.title = 'Hướng dẫn sử dụng';
            helpBtn.style.left = '18px';
            helpBtn.style.top = '18px';
            helpBtn.style.right = 'auto';
            helpBtn.style.backgroundColor = '#6a1b9a';
            helpBtn.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><text x="12" y="18" text-anchor="middle" font-size="18" font-weight="bold" font-family="Arial,sans-serif">?</text></svg>`;
            helpBtn.addEventListener('click', openHelpModalFull);
            tmUIRoot.appendChild(helpBtn);
        }
    }

    // Tìm/xóa element trong shadow root trước, rồi fallback document
    function removeElementById(id) {
        const el = tmUIRoot.querySelector('#' + id) || document.getElementById(id);
        if (el) el.remove();
    }
    function removeFloatingButtons() {
        removeElementById('tm-start-translate-btn');
        removeElementById('tm-edit-pencil');
        removeElementById('tm-style-button');
        removeElementById('tm-quick-translate-btn');
        removeElementById('tm-restore-original-btn');
        removeElementById('tm-ocr-float-btn');
        removeElementById('tm-library-btn');
        removeElementById('tm-help-float-btn');
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

    function hideSelectionEditButton() {
        if (selectionActionBar) selectionActionBar.remove();
        selectionActionBar = null;
    }
    function cacheSelectionRange(range) {
        if (!range || range.collapsed || !range.toString().trim()) return;
        lastSelectionRange = range.cloneRange();
        lastSelectionRange._textSnapshot = range.toString();
    }
    function scheduleSelectionEditButtonUpdate(delay = 80) {
        if (selectionEditRefreshTimer) clearTimeout(selectionEditRefreshTimer);
        selectionEditRefreshTimer = setTimeout(() => {
            selectionEditRefreshTimer = null;
            updateSelectionEditButton();
        }, delay);
    }
    function stopSelectionActionEvent(e) {
        if (e) {
            if (typeof e.preventDefault === 'function') e.preventDefault();
            if (typeof e.stopPropagation === 'function') e.stopPropagation();
            if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
        }
    }
    function getSelectionTextForAction() {
        const sel = window.getSelection();
        const liveText = sel ? sel.toString().trim() : '';
        if (liveText) return liveText;
        return String(lastSelectionRange?._textSnapshot || '').trim();
    }
    async function copyTextToClipboard(text) {
        const value = String(text || '');
        if (!value) return false;
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            try {
                await navigator.clipboard.writeText(value);
                return true;
            } catch (err) {
                console.warn('[tm-translate] Clipboard API bị chặn, thử fallback copy.', err);
            }
        }
        const temp = document.createElement('textarea');
        temp.value = value;
        temp.setAttribute('readonly', 'readonly');
        temp.style.position = 'fixed';
        temp.style.left = '-9999px';
        temp.style.top = '0';
        temp.style.opacity = '0';
        document.body.appendChild(temp);
        temp.select();
        const ok = document.execCommand('copy');
        temp.remove();
        return ok;
    }

    let ttsCoreErrorWatchTimer = 0;
    function getTtsErrorWatchDuration(settings) {
        const timeout = Number(settings?.remoteTimeoutMs) > 0 ? Number(settings.remoteTimeoutMs) : TTS_DEFAULT_SETTINGS.remoteTimeoutMs;
        const retries = Number(settings?.remoteRetries) >= 0 ? Number(settings.remoteRetries) : TTS_DEFAULT_SETTINGS.remoteRetries;
        return Math.min(120000, Math.max(15000, (timeout * (retries + 1)) + 5000));
    }

    function watchTtsCorePlaybackError(core, label = 'TTS lỗi', durationMs = 15000) {
        if (!core || typeof core.getState !== 'function') return;
        if (ttsCoreErrorWatchTimer) {
            clearInterval(ttsCoreErrorWatchTimer);
            ttsCoreErrorWatchTimer = 0;
        }
        const startedAt = Date.now();
        ttsCoreErrorWatchTimer = setInterval(() => {
            let state = null;
            try {
                state = core.getState();
            } catch (err) {
                clearInterval(ttsCoreErrorWatchTimer);
                ttsCoreErrorWatchTimer = 0;
                return;
            }
            const message = String(state?.lastError || '').trim();
            if (message) {
                clearInterval(ttsCoreErrorWatchTimer);
                ttsCoreErrorWatchTimer = 0;
                showNotification(`${label}: ${message}`, 4500);
                return;
            }
            const elapsed = Date.now() - startedAt;
            if ((!state?.playing && elapsed > 600) || elapsed > durationMs) {
                clearInterval(ttsCoreErrorWatchTimer);
                ttsCoreErrorWatchTimer = 0;
            }
        }, 350);
    }

    async function speakSelectionText(text) {
        const value = String(text || '').trim();
        if (!value) return;
        const core = getTtsCore();
        if (core && typeof core.speakText === 'function') {
            try {
                const settings = loadTtsSettings();
                const result = core.speakText(value, {
                    provider: settings.provider || 'browser',
                    settings,
                    lang: /[\u4e00-\u9fff]/.test(value) ? 'zh-CN' : 'vi-VN',
                    maxChars: settings.maxChars || TTS_DEFAULT_SETTINGS.maxChars,
                    title: 'TM Translate',
                    artist: 'TM Translate'
                });
                if (result && result.ok) {
                    showNotification('Đang phát đoạn chọn.');
                    watchTtsCorePlaybackError(core, 'Không phát được TTS', getTtsErrorWatchDuration(settings));
                    return;
                }
                if (result && result.reason === 'unsupported') {
                    showNotification('Trình duyệt chưa hỗ trợ phát đoạn chọn.');
                    return;
                }
            } catch (err) {
                console.warn('[tm-translate] TTS core không phát được đoạn chọn, thử fallback:', err);
            }
        }
        if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
            showNotification('Trình duyệt chưa hỗ trợ phát đoạn chọn.');
            return;
        }
        try {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(value);
            const settings = loadTtsSettings();
            utterance.lang = /[\u4e00-\u9fff]/.test(value) ? 'zh-CN' : 'vi-VN';
            utterance.rate = settings.rate;
            utterance.pitch = settings.pitch;
            utterance.volume = settings.volume;
            const voice = getTtsVoices().find(v => v.voiceURI === settings.voiceURI);
            if (voice) utterance.voice = voice;
            window.speechSynthesis.speak(utterance);
            showNotification('Đang phát đoạn chọn.');
        } catch (err) {
            console.warn('[tm-translate] Không phát được đoạn chọn:', err);
            showNotification('Không phát được đoạn chọn.');
        }
    }
    function getActiveSelectionRangeForAction() {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
            const range = sel.getRangeAt(0);
            if (range && range.toString().trim()) {
                cacheSelectionRange(range);
                return range;
            }
        }
        if (lastSelectionRange && !lastSelectionRange.collapsed) {
            const text = String(lastSelectionRange._textSnapshot || lastSelectionRange.toString() || '').trim();
            if (text) return lastSelectionRange.cloneRange ? lastSelectionRange.cloneRange() : lastSelectionRange;
        }
        return null;
    }
    function getReaderChapterForSelection(range) {
        if (!range || !libReaderState?.chapters?.length) {
            return { chapter: null, chapterIndex: -1 };
        }
        const container = getSelectionContainer(range);
        const block = container?.closest?.('.tm-reader-block[data-chapter-id]');
        const blockChapterId = block?.dataset?.chapterId || '';
        let chapterIndex = blockChapterId
            ? libReaderState.chapters.findIndex(ch => ch.chapterId === blockChapterId)
            : Number(libReaderState.currentIndex || 0);
        if (chapterIndex < 0 || chapterIndex >= libReaderState.chapters.length) {
            chapterIndex = Number(libReaderState.currentIndex || 0);
        }
        return {
            chapter: libReaderState.chapters[chapterIndex] || null,
            chapterIndex
        };
    }
    function renderedReaderTextLength(node) {
        if (!node) return 0;
        if (node.nodeType === Node.TEXT_NODE) return String(node.nodeValue || '').length;
        if (node.nodeType !== Node.ELEMENT_NODE) return 0;
        const tag = (node.tagName || '').toLowerCase();
        if (tag === 'br') return 1;
        let total = 0;
        node.childNodes.forEach(child => { total += renderedReaderTextLength(child); });
        return total;
    }
    function offsetInsideReaderNode(root, targetNode, targetOffset) {
        if (!root || !targetNode) return null;
        if (root === targetNode) {
            if (root.nodeType === Node.TEXT_NODE) {
                return Math.max(0, Math.min(Number(targetOffset) || 0, String(root.nodeValue || '').length));
            }
            if (root.nodeType === Node.ELEMENT_NODE) {
                let sum = 0;
                const limit = Math.max(0, Math.min(Number(targetOffset) || 0, root.childNodes.length));
                for (let i = 0; i < limit; i++) {
                    sum += renderedReaderTextLength(root.childNodes[i]);
                }
                return sum;
            }
            return 0;
        }
        let acc = 0;
        for (const child of Array.from(root.childNodes || [])) {
            const inner = offsetInsideReaderNode(child, targetNode, targetOffset);
            if (inner != null) return acc + inner;
            acc += renderedReaderTextLength(child);
        }
        return null;
    }
    function computeReaderTextRootOffset(textRoot, targetNode, targetOffset) {
        if (!textRoot || !targetNode) return null;
        const paragraphs = Array.from(textRoot.children || [])
            .filter(el => (el.tagName || '').toLowerCase() === 'p');
        if (!paragraphs.length) return offsetInsideReaderNode(textRoot, targetNode, targetOffset);
        let total = 0;
        for (let i = 0; i < paragraphs.length; i++) {
            const paragraph = paragraphs[i];
            if (i > 0) total += 1;
            const inner = offsetInsideReaderNode(paragraph, targetNode, targetOffset);
            if (inner != null) return total + inner;
            total += renderedReaderTextLength(paragraph);
        }
        return null;
    }
    function getReaderRawSelectionInfo(range) {
        if (!range) return null;
        const container = getSelectionContainer(range);
        const textRoot = container?.closest?.('.tm-reader-block-text, .tm-reader-text');
        if (!textRoot || !textRoot.contains(range.startContainer) || !textRoot.contains(range.endContainer)) return null;
        const startRaw = computeReaderTextRootOffset(textRoot, range.startContainer, range.startOffset);
        const endRaw = computeReaderTextRootOffset(textRoot, range.endContainer, range.endOffset);
        if (startRaw == null || endRaw == null) return null;
        const exactText = String(range.toString() || '');
        return {
            start: Math.max(0, Math.min(startRaw, endRaw)),
            end: Math.max(0, Math.max(startRaw, endRaw)),
            exactText,
            sourceText: exactText.trim()
        };
    }
    function getSelectionReaderContext(range = getActiveSelectionRangeForAction()) {
        if (!range || !libReaderState?.book) return null;
        const readerRoot = document.getElementById('tm-reader-overlay');
        const rangeContainer = range.commonAncestorContainer?.nodeType === 3
            ? range.commonAncestorContainer.parentElement
            : range.commonAncestorContainer;
        const readerContent = readerRoot ? readerRoot.querySelector('.tm-reader-content') : null;
        const isReaderSelection = !!(readerContent && rangeContainer && readerContent.contains(rangeContainer));
        if (!isReaderSelection) return null;
        const { chapter, chapterIndex } = getReaderChapterForSelection(range);
        const isRawOnlyBook = libReaderState.book.langSource === 'vi';
        return {
            range,
            readerRoot,
            readerContent,
            book: libReaderState.book,
            mode: libReaderState.mode,
            chapter,
            chapterIndex,
            rawSelection: isRawOnlyBook ? getReaderRawSelectionInfo(range) : null,
            isRawOnlyBook,
            isTranslatableBook: libReaderState.book.langSource === 'zh'
        };
    }
    function getDatasetOrigText(el) {
        if (!el) return '';
        if (el.dataset && typeof el.dataset.orig === 'string') return el.dataset.orig;
        return unescapeHtml(el.getAttribute?.('data-orig') || '');
    }
    function getSelectionSourceTextForRawEdit(range, selectedText, context) {
        const value = String(selectedText || '').trim();
        if (!value) return '';
        if (/[\u4e00-\u9fff]/.test(value)) return value;
        const targetSpan = findChunkFromRange(range);
        if (targetSpan?.classList?.contains('tm-name')) {
            const original = getDatasetOrigText(targetSpan).trim();
            if (original) return original;
        }
        if (context?.isRawOnlyBook || context?.mode === 'raw') return value;
        return value;
    }
    function buildSelectionRawEditNote(kind, context) {
        const staleText = context?.isTranslatableBook
            ? 'Cache dịch của chương sẽ bị xóa để dịch lại từ raw mới.'
            : 'Nội dung raw của chương hiện tại sẽ được cập nhật trực tiếp.';
        if (kind === 'junk') {
            if (context?.isTranslatableBook && context?.mode === 'trans') {
                return `Đang chọn trên bản dịch. Hãy sửa ô dưới thành cụm Trung/raw cần xóa trước khi xác nhận. ${staleText}`;
            }
            return `Cụm dưới sẽ bị xóa khỏi raw của chương hiện tại. ${staleText}`;
        }
        return `Thay thế cụm được chọn trong raw của chương hiện tại. ${staleText}`;
    }
    function replaceLiteralInText(text, source, replacement, ignoreCase) {
        const content = String(text || '');
        const needle = String(source || '');
        const target = String(replacement || '');
        if (!needle) return { text: content, count: 0 };
        if (!ignoreCase) {
            const parts = content.split(needle);
            const count = parts.length - 1;
            return { text: count > 0 ? parts.join(target) : content, count };
        }
        let count = 0;
        const pattern = new RegExp(escapeRegExp(needle), 'gi');
        const nextText = content.replace(pattern, () => {
            count += 1;
            return target;
        });
        return { text: nextText, count };
    }
    function applyJunkLiteralToRawText(rawText, source, ignoreCase) {
        const lines = String(rawText || '').split('\n');
        let total = 0;
        const kept = [];
        lines.forEach(rawLine => {
            const originalBlank = !String(rawLine || '').trim();
            const result = replaceLiteralInText(rawLine, source, '', ignoreCase);
            let line = result.text;
            total += result.count;
            if (result.count > 0) {
                line = line.replace(/[^\S\n]+$/g, '');
                if (!line.trim() && !originalBlank) return;
            }
            kept.push(line);
        });
        return {
            text: libNormalizeChapterParagraphBreaks(kept.join('\n')),
            count: total
        };
    }
    function applyReplaceLiteralToRawText(rawText, source, target, ignoreCase) {
        const result = replaceLiteralInText(rawText, source, target, ignoreCase);
        return {
            text: libNormalizeChapterParagraphBreaks(result.text),
            count: result.count
        };
    }
    function applyExactRawOnlySelectionEdit(rawText, context, kind, source, target, ignoreCase) {
        const info = context?.rawSelection;
        if (!context?.isRawOnlyBook || !info || ignoreCase) return null;
        if (!source || source !== String(info.sourceText || '').trim()) return null;
        const content = String(rawText || '');
        const start = Math.max(0, Math.min(Number(info.start) || 0, content.length));
        const end = Math.max(start, Math.min(Number(info.end) || 0, content.length));
        if (end <= start) return null;
        const selectedSlice = content.slice(start, end);
        if (selectedSlice !== info.exactText && selectedSlice.trim() !== source) return null;
        const replacement = kind === 'junk' ? '' : String(target || '');
        return {
            text: libNormalizeChapterParagraphBreaks(content.slice(0, start) + replacement + content.slice(end)),
            count: 1
        };
    }
    async function saveReaderChapterRawText(context, nextRawText) {
        if (!context?.chapter || !context?.book) throw new Error('Không tìm thấy chương hiện tại.');
        const chapter = context.chapter;
        const { raw, rawText } = await libGetNormalizedRawChapterContent(chapter);
        if (!raw) throw new Error('Không tìm thấy raw của chương.');
        const normalizedText = libNormalizeChapterParagraphBreaks(nextRawText);
        if (normalizedText === rawText) return false;

        const now = Date.now();
        const oldRawKey = chapter.rawKey;
        const oldTransKey = chapter.transKey;
        const nextRawKey = libMakeRawKey(chapter.chapterId, normalizedText);
        await libPutMany('tm_content', [{
            ...raw,
            key: nextRawKey,
            text: normalizedText,
            lang: raw.lang || context.book.langSource || 'zh',
            createdAt: raw.createdAt || now,
            updatedAt: now
        }]);
        if (oldRawKey && oldRawKey !== nextRawKey) libDeleteContent(oldRawKey);
        if (oldTransKey) libDeleteContent(oldTransKey);

        const updatedChapter = {
            ...chapter,
            rawKey: nextRawKey,
            transKey: null,
            updatedAt: now
        };
        await libPutMany('tm_chapters', [updatedChapter]);

        if (libReaderState?.chapters) {
            const index = context.chapterIndex >= 0
                ? context.chapterIndex
                : libReaderState.chapters.findIndex(ch => ch.chapterId === chapter.chapterId);
            if (index >= 0) {
                libReaderState.chapters[index] = updatedChapter;
                libReaderState.currentIndex = index;
            }
        }

        const ratio = libReaderGetCurrentScrollRatio();
        if (libReaderState?.book) {
            libReaderState.book.lastReadChapterId = updatedChapter.chapterId;
            libReaderState.book.lastReadOrder = updatedChapter.order || ((libReaderState.currentIndex || 0) + 1);
            libReaderState.book.lastReadScrollRatio = ratio;
            libReaderState.lastScrollRatio = ratio;
        }
        libUpdateBookLastRead(context.book.bookId, updatedChapter.chapterId, ratio, updatedChapter.order || ((libReaderState?.currentIndex || 0) + 1));
        libSetBackupStatus({ state: 'dirty', message: 'Raw truyện có thay đổi chưa sao lưu.' });
        await libReaderLoadCurrentChapter({ scrollTo: 'restore' });
        return true;
    }
    async function applySelectionRawEdit(kind, context, values) {
        if (!context?.chapter) {
            showNotification('Không tìm thấy chương để sửa raw.');
            return;
        }
        const source = String(values?.source || '').trim();
        const target = String(values?.target || '');
        const ignoreCase = !!values?.ignoreCase;
        if (!source) {
            showNotification(kind === 'junk' ? 'Nhập cụm cần xóa.' : 'Nhập từ cần thay.');
            return;
        }
        if (kind === 'replace' && !target.trim()) {
            showNotification('Nhập từ thay thế.');
            return;
        }
        showLoading(kind === 'junk' ? 'Đang xóa rác khỏi raw...' : 'Đang thay thế raw...');
        try {
            const { rawText } = await libGetNormalizedRawChapterContent(context.chapter);
            const result = applyExactRawOnlySelectionEdit(rawText, context, kind, source, target, ignoreCase) || (kind === 'junk'
                ? applyJunkLiteralToRawText(rawText, source, ignoreCase)
                : applyReplaceLiteralToRawText(rawText, source, target, ignoreCase));
            if (result.count <= 0) {
                showNotification(context.mode === 'trans'
                    ? 'Không tìm thấy cụm này trong raw. Hãy sửa thành cụm Trung/raw rồi thử lại.'
                    : 'Không tìm thấy cụm này trong raw.');
                return;
            }
            const changed = await saveReaderChapterRawText(context, result.text);
            if (!changed) {
                showNotification('Không có thay đổi trong raw.');
                return;
            }
            showNotification(kind === 'junk'
                ? `Đã xóa ${result.count} lần trong raw.`
                : `Đã thay thế ${result.count} lần trong raw.`);
        } catch (err) {
            console.error('[tm-translate] Không cập nhật được raw đoạn chọn:', err);
            showNotification(kind === 'junk' ? 'Xóa rác thất bại.' : 'Thay thế từ thất bại.');
        } finally {
            removeLoading();
        }
    }
    function applySelectionActionModalReaderTheme(wrapper, context) {
        const readerRoot = context?.readerRoot || document.getElementById('tm-reader-overlay');
        if (!wrapper || !readerRoot) return;
        const readerStyles = getComputedStyle(readerRoot);
        const themeBg = (readerStyles.getPropertyValue('--tm-reader-bg') || '#f7f4ee').trim();
        const themeText = (readerStyles.getPropertyValue('--tm-reader-text') || '#1f1f1f').trim();
        const themeSurface = (readerStyles.getPropertyValue('--tm-reader-surface') || '#fbf9f4').trim();
        const themeBorder = (readerStyles.getPropertyValue('--tm-reader-border') || '#ddd').trim();
        const themeFont = (readerStyles.getPropertyValue('--tm-reader-font') || '"Noto Serif", "Times New Roman", serif').trim();

        wrapper.style.fontFamily = themeFont;
        wrapper.style.color = themeText;
        const modalBox = wrapper.querySelector('.tm-modal-box');
        const modalHeader = wrapper.querySelector('.tm-modal-header');
        const modalContent = wrapper.querySelector('.tm-modal-content');
        const modalFooter = wrapper.querySelector('.tm-modal-footer');
        if (modalBox) {
            modalBox.style.background = themeBg;
            modalBox.style.color = themeText;
            modalBox.style.border = `1px solid ${themeBorder}`;
        }
        if (modalHeader) {
            modalHeader.style.background = themeSurface;
            modalHeader.style.borderBottomColor = themeBorder;
        }
        if (modalContent) {
            modalContent.style.background = themeBg;
            modalContent.style.color = themeText;
        }
        if (modalFooter) {
            modalFooter.style.background = themeSurface;
            modalFooter.style.borderTopColor = themeBorder;
        }
        wrapper.querySelectorAll('.tm-input, .tm-textarea').forEach(input => {
            input.style.background = themeSurface;
            input.style.color = themeText;
            input.style.borderColor = themeBorder;
        });
        wrapper.querySelectorAll('.tm-btn').forEach(btn => {
            btn.style.background = btn.classList.contains('tm-btn-primary') ? 'var(--tm-primary)' : 'transparent';
            btn.style.color = btn.classList.contains('tm-btn-primary') ? '#fff' : themeText;
            btn.style.borderColor = btn.classList.contains('tm-btn-primary') ? 'var(--tm-primary)' : themeBorder;
        });
    }
    function showSelectionRawEditModal(kind, context, initialSource) {
        removeElementById('tm-selection-action-modal');
        const isJunk = kind === 'junk';
        const wrapper = document.createElement('div');
        wrapper.id = 'tm-selection-action-modal';
        wrapper.className = 'tm-modal-wrapper';
        wrapper.style.zIndex = '2147483664';
        const title = isJunk ? 'Xóa rác' : 'Thay thế từ';
        const sourceLabel = isJunk ? 'Cụm cần xóa trong raw' : 'Từ cần thay';
        const confirmLabel = isJunk ? 'Xóa rác' : 'Thay thế';
        const sourceControl = isJunk
            ? `<textarea id="tm-selection-source-input" class="tm-textarea" rows="4" spellcheck="false">${escapeHtml(initialSource)}</textarea>`
            : `<input id="tm-selection-source-input" class="tm-input" spellcheck="false" value="${escapeHtml(initialSource)}" />`;
        const targetControl = isJunk ? '' : `
                <label class="tm-label">Thay bằng</label>
                <input id="tm-selection-target-input" class="tm-input" spellcheck="false" value="" />
        `;
        wrapper.innerHTML = `
            <div class="tm-modal-backdrop"></div>
            <form class="tm-modal-box">
                <div class="tm-modal-header">
                    <h3>${title}</h3>
                    <button class="tm-btn" id="tm-selection-action-close" type="button">&times;</button>
                </div>
                <div class="tm-modal-content">
                    <p class="tm-selection-action-note">${escapeHtml(buildSelectionRawEditNote(kind, context))}</p>
                    <label class="tm-label">${sourceLabel}</label>
                    ${sourceControl}
                    ${targetControl}
                    <label class="tm-selection-action-check">
                        <input id="tm-selection-ignore-case" type="checkbox" />
                        <span>Aa Không phân biệt hoa thường</span>
                    </label>
                </div>
                <div class="tm-modal-footer">
                    <button class="tm-btn" id="tm-selection-action-cancel" type="button">Hủy</button>
                    <button class="tm-btn tm-btn-primary" type="submit">${confirmLabel}</button>
                </div>
            </form>
        `;
        tmUIRoot.appendChild(wrapper);
        applySelectionActionModalReaderTheme(wrapper, context);

        const close = () => wrapper.remove();
        wrapper.querySelector('.tm-modal-backdrop')?.addEventListener('click', close);
        wrapper.querySelector('#tm-selection-action-close')?.addEventListener('click', close);
        wrapper.querySelector('#tm-selection-action-cancel')?.addEventListener('click', close);
        wrapper.querySelector('form')?.addEventListener('submit', async (event) => {
            event.preventDefault();
            const sourceInput = wrapper.querySelector('#tm-selection-source-input');
            const targetInput = wrapper.querySelector('#tm-selection-target-input');
            const ignoreCase = !!wrapper.querySelector('#tm-selection-ignore-case')?.checked;
            const source = String(sourceInput?.value || '').trim();
            const target = String(targetInput?.value || '');
            if (!source) {
                showNotification(isJunk ? 'Nhập cụm cần xóa.' : 'Nhập từ cần thay.');
                sourceInput?.focus();
                return;
            }
            if (!isJunk && !target.trim()) {
                showNotification('Nhập từ thay thế.');
                targetInput?.focus();
                return;
            }
            close();
            await applySelectionRawEdit(kind, context, { source, target, ignoreCase });
        });

        const sourceInput = wrapper.querySelector('#tm-selection-source-input');
        setTimeout(() => {
            sourceInput?.focus();
            try {
                sourceInput?.setSelectionRange(0, sourceInput.value.length);
            } catch (err) { /* ignore */ }
        }, 10);
    }
    function openSelectionRawEditModalForSelection(kind, range = getActiveSelectionRangeForAction(), selectedText = getSelectionTextForAction()) {
        const context = getSelectionReaderContext(range);
        if (!context?.chapter) {
            showNotification('Không tìm thấy chương để sửa raw.');
            return;
        }
        const source = getSelectionSourceTextForRawEdit(range, selectedText, context);
        if (!source) {
            showNotification('Không tìm thấy đoạn chọn.');
            return;
        }
        showSelectionRawEditModal(kind, context, source);
    }
    async function activateSelectionAction(action, e) {
        stopSelectionActionEvent(e);
        const now = Date.now();
        if (now - selectionActionLastActivation < 220) return;
        selectionActionLastActivation = now;
        const selectedText = getSelectionTextForAction();
        const range = getActiveSelectionRangeForAction();
        if (!selectedText && action !== 'edit') {
            hideSelectionEditButton();
            return;
        }
        if (action === 'edit') {
            const context = getSelectionReaderContext(range);
            if (context?.isRawOnlyBook) {
                openSelectionRawEditModalForSelection('replace', range, selectedText);
            } else {
                openEditModalForSelection();
            }
            hideSelectionEditButton();
            return;
        }
        if (action === 'copy') {
            try {
                await copyTextToClipboard(selectedText);
                showNotification('Đã sao chép đoạn chọn.');
            } catch (err) {
                console.warn('[tm-translate] Không sao chép được đoạn chọn:', err);
                showNotification('Không sao chép được đoạn chọn.');
            }
            hideSelectionEditButton();
            return;
        }
        if (action === 'speak') {
            const handledByReader = await libReaderTtsStartFromSelection(range);
            if (!handledByReader) await speakSelectionText(selectedText);
            hideSelectionEditButton();
            return;
        }
        if (action === 'junk') {
            openSelectionRawEditModalForSelection('junk', range, selectedText);
            hideSelectionEditButton();
        }
    }
    function getSelectionRangeRect(range) {
        if (!range) return null;
        const rects = Array.from(range.getClientRects ? range.getClientRects() : [])
            .filter(rect => rect && (rect.width > 0 || rect.height > 0));
        if (rects.length > 0) {
            return rects[0];
        }
        return range.getBoundingClientRect ? range.getBoundingClientRect() : null;
    }
    function getSelectionContainer(range) {
        if (!range) return null;
        const node = range.commonAncestorContainer;
        if (!node) return null;
        return node.nodeType === 3 ? node.parentElement : node;
    }
    function shouldIgnoreSelectionForEdit(range) {
        const el = getSelectionContainer(range);
        if (!el) return true;
        if (el.closest('#tm-settings-modal, #tm-edit-modal, #tm-selection-action-modal, #tm-style-panel, #tm-quick-translate-panel, #tm-ocr-result-modal')) return true;
        if (el.closest('input, textarea, [contenteditable="true"]')) return true;
        return false;
    }
    function updateSelectionEditButton() {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
            hideSelectionEditButton();
            return;
        }
        const text = sel.toString().trim();
        if (!text) {
            hideSelectionEditButton();
            return;
        }
        const range = sel.getRangeAt(0);
        if (shouldIgnoreSelectionForEdit(range)) {
            hideSelectionEditButton();
            return;
        }
        const readerRoot = document.getElementById('tm-reader-overlay');
        const rangeContainer = range.commonAncestorContainer?.nodeType === 3 ? range.commonAncestorContainer.parentElement : range.commonAncestorContainer;
        const readerContent = readerRoot ? readerRoot.querySelector('.tm-reader-content') : null;
        const isReaderSelection = !!(readerContent && rangeContainer && readerContent.contains(rangeContainer));
        if (!isReaderSelection) {
            hideSelectionEditButton();
            return;
        }
        const rect = getSelectionRangeRect(range);
        if (!rect || (rect.width === 0 && rect.height === 0)) {
            hideSelectionEditButton();
            return;
        }
        if (!selectionActionBar) {
            selectionActionBar = document.createElement('div');
            selectionActionBar.id = 'tm-selection-action-bar';
            selectionActionBar.setAttribute('role', 'toolbar');
            selectionActionBar.setAttribute('aria-label', 'Tiện ích đoạn chọn');
            selectionActionBar.innerHTML = `
                <button class="tm-selection-action-btn" data-action="speak" type="button">Phát</button>
                <button class="tm-selection-action-btn" data-action="edit" type="button">Sửa tên</button>
                <button class="tm-selection-action-btn" data-action="junk" type="button">Xóa rác</button>
                <button class="tm-selection-action-btn" data-action="copy" type="button">Sao chép</button>
            `;
            const handleAction = (event) => {
                const btn = event.target.closest?.('.tm-selection-action-btn');
                if (!btn) {
                    stopSelectionActionEvent(event);
                    return;
                }
                activateSelectionAction(btn.dataset.action || '', event);
            };
            selectionActionBar.addEventListener('pointerdown', handleAction, { passive: false });
            selectionActionBar.addEventListener('touchstart', handleAction, { passive: false });
            selectionActionBar.addEventListener('mousedown', stopSelectionActionEvent);
            selectionActionBar.addEventListener('click', handleAction);
            tmUIRoot.appendChild(selectionActionBar);
        }
        const context = getSelectionReaderContext(range);
        const editBtn = selectionActionBar.querySelector('.tm-selection-action-btn[data-action="edit"]');
        if (editBtn) {
            const isReplaceAction = !!context?.isRawOnlyBook;
            editBtn.textContent = isReplaceAction ? 'Thay thế từ' : 'Sửa tên';
            editBtn.title = isReplaceAction ? 'Thay thế đoạn chọn trong raw' : 'Thêm hoặc sửa name';
            editBtn.style.display = (isReplaceAction || config.nameEditingEnabled) ? '' : 'none';
        }
        selectionActionBar.style.visibility = 'hidden';
        selectionActionBar.style.left = '8px';
        selectionActionBar.style.top = '8px';
        const width = Math.max(160, selectionActionBar.offsetWidth || 0);
        const height = Math.max(36, selectionActionBar.offsetHeight || 0);
        const left = Math.min(window.innerWidth - width - 8, Math.max(8, rect.left + rect.width / 2 - width / 2));
        let top = rect.top - height - 10;
        if (top < 8) top = Math.min(window.innerHeight - height - 8, rect.bottom + 10);
        selectionActionBar.style.left = `${Math.round(left)}px`;
        selectionActionBar.style.top = `${Math.round(Math.max(8, top))}px`;
        selectionActionBar.style.visibility = '';
    }
    document.addEventListener('selectionchange', () => {
        try {
            const sel = window.getSelection();
            if (!sel || sel.rangeCount === 0) {
                scheduleSelectionEditButtonUpdate(80);
                return;
            }
            const r = sel.getRangeAt(0);
            if (r && !r.collapsed && r.toString().trim()) {
                cacheSelectionRange(r);
            }
            scheduleSelectionEditButtonUpdate(80);
        } catch (e) { /* ignore */ }
    });
    document.addEventListener('mouseup', () => scheduleSelectionEditButtonUpdate(24));
    document.addEventListener('touchend', () => scheduleSelectionEditButtonUpdate(120), { passive: true });
    document.addEventListener('contextmenu', (e) => {
        try {
            const sel = window.getSelection();
            if (!sel || !sel.toString().trim() || sel.rangeCount === 0) return;
            const range = sel.getRangeAt(0);
            const readerRoot = document.getElementById('tm-reader-overlay');
            const container = range.commonAncestorContainer?.nodeType === 3 ? range.commonAncestorContainer.parentElement : range.commonAncestorContainer;
            if (readerRoot && container && readerRoot.contains(container)) {
                e.preventDefault();
                e.stopPropagation();
                scheduleSelectionEditButtonUpdate(10);
            }
        } catch (err) { /* ignore */ }
    }, true);

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
        const ignoreRootIds = ['tm-edit-pencil', 'tm-selection-edit-btn', 'tm-selection-action-bar', 'tm-selection-action-modal', 'tm-style-button', 'tm-edit-modal', 'tm-settings-modal', 'tm-style-panel', 'tm-library-btn'];
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
            const regex = createSafeRegExp(escapeRegExp(placeholder), 'g', `placeholder:${placeholder}`);
            if (!regex) continue;
            result = result.replace(regex, () => `${placeholderMap[placeholder].viet} `);
        }
        result = result.replace(/\s+([,.;!?\)]|”|’|:)/g, '$1');
        result = result.replace(/([\(\[“‘])\s+/g, '$1');
        result = result.replace(/:([^\s])/g, (match, nextChar, offset, str) => {
            const prevChar = str[offset - 1] || '';
            if (nextChar === '/' || (/\d/.test(prevChar) && /\d/.test(nextChar))) {
                return match;
            }
            return `: ${nextChar}`;
        });
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

    function extractJsonParsePosition(err) {
        const message = (err && err.message ? err.message : String(err || '')).toString();
        const match = message.match(/position\s+(\d+)/i);
        return match ? parseInt(match[1], 10) : -1;
    }

    function buildDebugSnippet(text, position = -1, radius = 180) {
        const raw = String(text || '');
        if (!raw) return '';
        const pos = Number.isInteger(position) && position >= 0 ? position : -1;
        if (pos < 0 || pos >= raw.length) {
            return raw.slice(0, Math.min(raw.length, radius * 2));
        }
        const start = Math.max(0, pos - radius);
        const end = Math.min(raw.length, pos + radius);
        const head = start > 0 ? '...' : '';
        const tail = end < raw.length ? '...' : '';
        return `${head}${raw.slice(start, pos)}<<<ERROR_AT_${pos}>>>${raw.slice(pos, end)}${tail}`;
    }

    function logTranslationParseFailure(error, meta = {}) {
        const label = `[tm-translate] Parse JSON lỗi từ server (${meta.provider || 'unknown'}, ${meta.batchSize || 0} đoạn, ${meta.totalChars || 0} ký tự)`;
        try {
            console.groupCollapsed(label);
            console.error(error);
            console.log('[tm-translate] Meta:', meta);
            if (meta.responseSnippet) {
                console.log('[tm-translate] Response snippet:', meta.responseSnippet);
            }
            if (meta.translatedSnippet) {
                console.log('[tm-translate] translatedContent snippet:', meta.translatedSnippet);
            }
            if (meta.sanitizedSnippet) {
                console.log('[tm-translate] sanitizedContent snippet:', meta.sanitizedSnippet);
            }
            if (meta.repairedSnippet) {
                console.log('[tm-translate] repairedContent snippet:', meta.repairedSnippet);
            }
            console.groupEnd();
        } catch (logErr) {
            console.error(label, error, meta, logErr);
        }
    }

    function buildTranslationError(message, code, meta = {}, cause = null) {
        const err = new Error(message);
        if (code) err.code = code;
        err.meta = meta;
        if (cause) err.cause = cause;
        return err;
    }

    function repairMalformedDichngayContentString(content) {
        if (typeof content !== 'string' || !content) return content || '';
        return content
            // dichngay đôi lúc trả về kiểu `\\ "Noi dung"` hoặc `\\\"Noi dung` cho lời thoại,
            // khiến quote mở trong từng item không còn là escape hợp lệ của JSON.
            .replace(/\\+\s*"(?=\s*[^,\]])/g, '\\"');
    }

    function isNonRetriableTranslationError(err) {
        const code = err?.code || '';
        return code === 'TRANSLATION_PARSE_ERROR' || code === 'TRANSLATION_BAD_RESPONSE';
    }

    function parseDichngayStringArrayLenient(rawContent, expectedCount = 0) {
        const text = String(rawContent || '').trim();
        if (!text.startsWith('[')) {
            throw new Error('Response content was not array-like.');
        }

        let index = 0;
        const len = text.length;
        const values = [];
        const isSpace = ch => /\s/.test(ch || '');
        const skipSpaces = () => {
            while (index < len && isSpace(text[index])) index++;
        };

        function decodeEscape() {
            if (text[index] !== '\\') return '';
            const next = text[index + 1];
            if (next === 'u' && /^[0-9a-fA-F]{4}$/.test(text.slice(index + 2, index + 6))) {
                const decoded = String.fromCharCode(parseInt(text.slice(index + 2, index + 6), 16));
                index += 6;
                return decoded;
            }
            const escapeMap = { '"': '"', '\\': '\\', '/': '/', b: '\b', f: '\f', n: '\n', r: '\r', t: '\t' };
            if (Object.prototype.hasOwnProperty.call(escapeMap, next)) {
                index += 2;
                return escapeMap[next];
            }

            let quoteIndex = index + 1;
            while (quoteIndex < len && isSpace(text[quoteIndex])) quoteIndex++;
            if (text[quoteIndex] === '"') {
                index = quoteIndex + 1;
                return '"';
            }

            index += 1;
            return '\\';
        }

        skipSpaces();
        if (text[index] !== '[') {
            throw new Error(`Missing '[' at position ${index}.`);
        }
        index++;

        while (index < len) {
            skipSpaces();
            if (text[index] === ']') {
                index++;
                break;
            }
            if (text[index] !== '"') {
                throw new Error(`Expected string opening quote at position ${index}.`);
            }
            index++;

            let value = '';
            while (index < len) {
                const ch = text[index];
                if (ch === '\\') {
                    value += decodeEscape();
                    continue;
                }
                if (ch === '"') {
                    let nextIndex = index + 1;
                    while (nextIndex < len && isSpace(text[nextIndex])) nextIndex++;
                    const nextChar = text[nextIndex];
                    const isEndOfArray = nextIndex >= len || nextChar === ']';
                    let isItemSeparator = false;
                    if (nextChar === ',') {
                        let afterComma = nextIndex + 1;
                        while (afterComma < len && isSpace(text[afterComma])) afterComma++;
                        isItemSeparator = afterComma >= len || text[afterComma] === '"' || text[afterComma] === ']';
                    }
                    if (isEndOfArray || isItemSeparator) {
                        index = nextIndex;
                        break;
                    }
                    value += '"';
                    index++;
                    continue;
                }
                value += ch;
                index++;
            }

            values.push(value);
            skipSpaces();
            if (text[index] === ',') {
                index++;
                continue;
            }
            if (text[index] === ']') {
                index++;
                break;
            }
        }

        if (expectedCount > 0 && values.length !== expectedCount) {
            throw new Error(`Lenient parser count mismatch: expected ${expectedCount}, got ${values.length}.`);
        }

        return values;
    }

    function parseDichngayTranslationResponse(responseText, requestMeta = {}) {
        const jsonResponse = JSON.parse(responseText);
        const translatedContentString = jsonResponse?.data?.content ?? jsonResponse?.translatedText;

        if (typeof translatedContentString !== 'string') {
            throw buildTranslationError(
                "Server response 'content' was not a string.",
                'TRANSLATION_BAD_RESPONSE',
                {
                    ...requestMeta,
                    responseSnippet: buildDebugSnippet(responseText)
                }
            );
        }

        const sanitizedString = translatedContentString
            .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
            .replace(/\\(?!["\\\/bfnrtu])/g, '\\\\');
        const trimmedSanitized = sanitizedString.trim();

        if (requestMeta.allowPlainString && trimmedSanitized && !/^[\[{"]/.test(trimmedSanitized)) {
            return sanitizedString;
        }

        const repairedString = repairMalformedDichngayContentString(sanitizedString);

        try {
            return JSON.parse(sanitizedString);
        } catch (initialErr) {
            if (repairedString !== sanitizedString) {
                try {
                    return JSON.parse(repairedString);
                } catch (repairedErr) {
                    initialErr = repairedErr;
                }
            }
            const lenientSource = (repairedString || sanitizedString).trim();
            if (lenientSource.startsWith('[')) {
                try {
                    return parseDichngayStringArrayLenient(repairedString || sanitizedString, requestMeta.batchSize || 0);
                } catch (lenientErr) {
                    initialErr = lenientErr;
                }
            }
            if (requestMeta.allowPlainString) {
                return repairedString || sanitizedString;
            }
            const position = extractJsonParsePosition(initialErr);
            const meta = {
                ...requestMeta,
                position,
                responseLength: String(responseText || '').length,
                translatedLength: translatedContentString.length,
                sanitizedLength: sanitizedString.length,
                repairedLength: repairedString.length,
                repairAttempted: repairedString !== sanitizedString,
                responseSnippet: buildDebugSnippet(responseText),
                translatedSnippet: buildDebugSnippet(translatedContentString, position),
                sanitizedSnippet: buildDebugSnippet(sanitizedString, position),
                repairedSnippet: repairedString !== sanitizedString ? buildDebugSnippet(repairedString, position) : ''
            };
            logTranslationParseFailure(initialErr, meta);
            throw buildTranslationError(
                `Failed to parse response from server at position ${position >= 0 ? position : 'unknown'}.`,
                'TRANSLATION_PARSE_ERROR',
                meta,
                initialErr
            );
        }
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
                            resolve(parseDichngayTranslationResponse(res.responseText, {
                                provider: 'dichngay',
                                endpoint: serverUrl,
                                batchSize: Array.isArray(contentArray) ? contentArray.length : 0,
                                totalChars: Array.isArray(contentArray) ? contentArray.reduce((sum, item) => sum + String(item || '').length, 0) : 0,
                                status: res.status
                            }));
                        } catch (e) {
                            if (!(e && e.code === 'TRANSLATION_PARSE_ERROR')) {
                                console.error('[tm-translate] Lỗi xử lý response từ server:', e);
                            }
                            reject(e instanceof Error ? e : new Error('Failed to parse response from server. Error: ' + e));
                        }
                    } else {
                        reject(new Error('HTTP Error: ' + res.status));
                    }
                },
                onerror(err) { reject(err); }
            });
        });
    }

    function postTranslateSingle(serverUrl, contentText, targetLang) {
        return new Promise((resolve, reject) => {
            const payload = { content: String(contentText ?? ''), tl: targetLang };

            GM_xmlhttpRequest({
                method: 'POST',
                url: serverUrl,
                headers: { 'Content-Type': 'application/json', 'referer': 'https://dichngay.com/' },
                data: JSON.stringify(payload),
                onload(res) {
                    if (res.status < 200 || res.status >= 300) {
                        reject(new Error('HTTP Error: ' + res.status));
                        return;
                    }
                    try {
                        const parsed = parseDichngayTranslationResponse(res.responseText, {
                            provider: 'dichngay',
                            endpoint: serverUrl,
                            batchSize: 1,
                            totalChars: String(contentText || '').length,
                            status: res.status,
                            single: true,
                            allowPlainString: true
                        });
                        if (Array.isArray(parsed)) {
                            resolve((parsed[0] || '').toString());
                            return;
                        }
                        resolve(String(parsed ?? ''));
                    } catch (e) {
                        reject(e instanceof Error ? e : new Error(String(e)));
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

    async function requestServerTranslationOnce(contentArray) {
        const provider = (config.serverProvider || 'dichngay');
        const endpoint = getServerEndpoint(provider);
        if (provider === 'dichnhanh') {
            return await postTranslateDichnhanh(contentArray, config.dichnhanhOptions, endpoint);
        }
        return await postTranslate(endpoint, contentArray, config.targetLang);
    }

    async function requestServerTranslationSingleText(text) {
        const provider = (config.serverProvider || 'dichngay');
        const endpoint = getServerEndpoint(provider);
        if (provider === 'dichnhanh') {
            const translated = await postTranslateDichnhanh([text], config.dichnhanhOptions, endpoint);
            if (Array.isArray(translated)) return (translated[0] || '').toString();
            return String(translated ?? '');
        }
        return await postTranslateSingle(endpoint, text, config.targetLang);
    }

    async function requestServerTranslation(contentArray) {
        const safeArray = Array.isArray(contentArray) ? contentArray : [];
        if (safeArray.length === 0) return [];

        const retries = Math.max(0, parseInt(config.retryCount, 10) || 0);
        const provider = (config.serverProvider || 'dichngay');
        const delayMs = config.delayMs || 0;

        async function translateWithRetry(arr) {
            let attempt = 0;
            let lastError = null;
            while (attempt <= retries) {
                try {
                    return await requestServerTranslationOnce(arr);
                } catch (err) {
                    lastError = err;
                    if (isNonRetriableTranslationError(err)) break;
                    if (attempt >= retries) break;
                    await sleep(delayMs || 0);
                }
                attempt++;
            }
            throw lastError || new Error('Dịch thất bại.');
        }

        async function translateBatchRecursive(arr, depth = 0) {
            if (!Array.isArray(arr) || arr.length === 0) return [];

            if (arr.length === 1) {
                try {
                    const translatedSingle = await requestServerTranslationSingleText(arr[0]);
                    return [translatedSingle];
                } catch (err) {
                    console.error('[tm-translate] Dịch đoạn đơn thất bại sau khi tách batch.', {
                        provider,
                        depth,
                        length: String(arr[0] || '').length,
                        error: err?.message || err,
                        meta: err?.meta || null
                    });
                    throw err;
                }
        }

            try {
                return await translateWithRetry(arr);
            } catch (err) {
                const totalChars = arr.reduce((sum, item) => sum + String(item || '').length, 0);
                console.warn('[tm-translate] Dịch batch lỗi, chia đôi để thử lại.', {
                    provider,
                    depth,
                    items: arr.length,
                    totalChars,
                    error: err?.message || err,
                    meta: err?.meta || null
                });
                const mid = Math.ceil(arr.length / 2);
                const left = await translateBatchRecursive(arr.slice(0, mid), depth + 1);
                if (delayMs > 0) await sleep(delayMs);
                const right = await translateBatchRecursive(arr.slice(mid), depth + 1);
                return left.concat(right);
            }
        }

        if (safeArray.length === 1) {
            try {
                return [await requestServerTranslationSingleText(safeArray[0])];
            } catch (err) {
                console.error('[tm-translate] Dịch đoạn đơn thất bại.', {
                    provider,
                    length: String(safeArray[0] || '').length,
                    error: err?.message || err,
                    meta: err?.meta || null
                });
                throw err;
            }
        }

        try {
            return await translateWithRetry(safeArray);
        } catch (err) {
            console.warn('[tm-translate] Dịch batch lỗi, chuyển sang chia đôi batch.', {
                provider,
                items: safeArray.length,
                totalChars: safeArray.reduce((sum, item) => sum + String(item || '').length, 0),
                error: err?.message || err,
                meta: err?.meta || null
            });
            return await translateBatchRecursive(safeArray, 1);
        }
    }

    function highlightNamesInText(translatedText, nameSet, sourceText = '') {
        const source = String(sourceText || '');
        const vietToOrigMap = {};
        const vietCanonicalMap = {};
        for (const orig in nameSet) {
            if (!source || !source.includes(orig)) continue;
            const vietName = nameSet[orig];
            if (vietName) {
                const key = String(vietName).toLocaleLowerCase('vi-VN');
                vietToOrigMap[key] = orig;
                vietCanonicalMap[key] = vietName;
            }
        }

        const vietNames = Object.keys(vietToOrigMap);
        if (vietNames.length === 0) {
            return escapeHtml(translatedText);
        }

        const namePattern = vietNames
            .sort((a, b) => b.length - a.length)
            .map(name => escapeRegExp(name))
            .join('|');
        const regex = createSafeRegExp(
            `(^|[^\\p{L}\\p{N}\\p{M}])(${namePattern})(?=$|[^\\p{L}\\p{N}\\p{M}])`,
            'giu',
            'highlight-names'
        ) || createSafeRegExp(
            `(^|[^A-Za-z0-9_À-ÖØ-öø-ÿĀ-žƀ-ɏ\\u0300-\\u036f])(${namePattern})(?=$|[^A-Za-z0-9_À-ÖØ-öø-ÿĀ-žƀ-ɏ\\u0300-\\u036f])`,
            'gi',
            'highlight-names-fallback'
        );
        if (!regex) {
            return escapeHtml(translatedText);
        }

        return escapeHtml(translatedText).replace(regex, (matchedText, prefix, nameText) => {
            const lowerCaseMatch = String(nameText || '').toLocaleLowerCase('vi-VN');
            const origName = vietToOrigMap[lowerCaseMatch];

            if (origName) {
                const displayName = vietCanonicalMap[lowerCaseMatch] || nameText;
                return `${prefix}<span class="tm-name" data-orig="${escapeHtml(origName)}">${escapeHtml(displayName)}</span>`;
            }

            return matchedText;
        });
    }



    function tokenizeString(str) {
        const normalized = normalizeTextForTranslation(str);
        if (!normalized) return [];
        const parts = normalized.split(TOKEN_SPLIT_REGEX).filter(Boolean);
        const tokens = [];
        for (const part of parts) {
            if (TOKEN_SPECIAL_REGEX.test(part)) {
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

        const normalizedInput = normalizeTextForTranslation(fullInput || '');
        const paragraphs = normalizedInput.split(/\r?\n/);
        const textsToSend = [];
        const chunks = [];

        for (const para of paragraphs) {
            const paraTrimmed = para.trim();
            if (!paraTrimmed) {
                chunks.push({ isEmpty: true });
                continue;
            }

            const decodedText = paraTrimmed;
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
                const highlightedHtml = highlightNamesInText(capitalizedText, nameSet, chunk.original);
                const chunkHtml = `<span class="tm-chunk" data-orig="${escapeHtml(chunk.original)}">${highlightedHtml}</span>`;
                finalResult += `<p>${chunkHtml}</p>`;
            } else {

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
                    const highlightedHtml = highlightNamesInText(originalItem.translated, nameSet, originalItem.decodedOriginal);

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

                console.log('[tm-translate] Dịch hoàn tất. Đang áp dụng lên trang gốc...');
                document.body.replaceWith(translatedBodyClone.cloneNode(true));

                applyGlobalFontOverride();
                startAutoTranslateObserver();
            }


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

                if (container.offsetParent === null && container.tagName !== 'BODY') continue;

                const text = container.textContent.trim();
                if (text.length > maxTextLength) {
                    maxTextLength = text.length;
                    bestCandidate = container;
                }
            }

            if (bestCandidate && selector !== 'body') {
                console.log(`Tìm thấy ứng viên tốt nhất bằng selector '${selector}':`, bestCandidate);
                return bestCandidate;
            }
        }

        if (bestCandidate) {
            console.log(`Khối nội dung chính được chọn có ${maxTextLength} ký tự.`, bestCandidate);
            return bestCandidate;
        }


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
                    chunkSpan.innerHTML = highlightNamesInText(finalTranslatedText, nameSet, originalTextToShow);
                    finalContent = chunkSpan;
                } else {
                    finalContent = document.createTextNode(finalTranslatedText);
                }
            }


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
        tmRemoveEl('tm-notification-bubble');
        const div = document.createElement('div');
        div.id = 'tm-notification-bubble';
        div.textContent = message;
        div.style.cssText = 'opacity:0; transition: opacity 0.3s ease;';
        tmUIRoot.appendChild(div);
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
                const highlightedHtml = highlightNamesInText(it.translated, nameSet, it.decodedOriginal);

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

    function showEditModal(chinese, vietnamese, options = {}) {
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
        tmUIRoot.appendChild(wrapper);

        // NEW: Áp dụng theme của UI đọc truyện nếu đang mở reader
        const readerRoot = document.getElementById('tm-reader-overlay');
        if (options.readerTheme && readerRoot) {
            const readerStyles = getComputedStyle(readerRoot);
            const themeBg = (readerStyles.getPropertyValue('--tm-reader-bg') || '#f7f4ee').trim();
            const themeText = (readerStyles.getPropertyValue('--tm-reader-text') || '#1f1f1f').trim();
            const themeSurface = (readerStyles.getPropertyValue('--tm-reader-surface') || '#fbf9f4').trim();
            const themeBorder = (readerStyles.getPropertyValue('--tm-reader-border') || '#ddd').trim();
            const themeFont = (readerStyles.getPropertyValue('--tm-reader-font') || '"Noto Serif", "Times New Roman", serif').trim();

            wrapper.style.fontFamily = themeFont;
            wrapper.style.color = themeText;
            const modalBox = wrapper.querySelector('.tm-modal-box');
            const modalHeader = wrapper.querySelector('.tm-modal-header');
            const modalContent = wrapper.querySelector('.tm-modal-content');
            const modalFooter = wrapper.querySelector('.tm-modal-footer');

            if (modalBox) {
                modalBox.style.background = themeBg;
                modalBox.style.color = themeText;
                modalBox.style.border = `1px solid ${themeBorder}`;
            }
            if (modalHeader) {
                modalHeader.style.background = themeSurface;
                modalHeader.style.borderBottomColor = themeBorder;
            }
            if (modalContent) {
                modalContent.style.background = themeBg;
                modalContent.style.color = themeText;
            }
            if (modalFooter) {
                modalFooter.style.background = themeSurface;
                modalFooter.style.borderTopColor = themeBorder;
            }
            wrapper.querySelectorAll('.tm-input, .tm-textarea, .tm-select').forEach(input => {
                input.style.background = themeSurface;
                input.style.color = themeText;
                input.style.borderColor = themeBorder;
            });
            wrapper.querySelectorAll('.tm-btn').forEach(btn => {
                btn.style.background = 'transparent';
                btn.style.color = themeText;
                btn.style.borderColor = themeBorder;
            });
        }

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
            const btnAdd = tmEl('tm-edit-add');
            const btnSave = tmEl('tm-edit-save');
            const btnDelete = tmEl('tm-edit-delete');

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
        const readerRoot = document.getElementById('tm-reader-overlay');
        const rangeContainer = range.commonAncestorContainer?.nodeType === 3 ? range.commonAncestorContainer.parentElement : range.commonAncestorContainer;
        const isReaderSelection = !!(readerRoot && rangeContainer && readerRoot.contains(rangeContainer));
        const selectedText = sel.toString().trim();
        if (isReaderSelection && libReaderState?.book?.langSource === 'vi') {
            openSelectionRawEditModalForSelection('replace', range, selectedText);
            return;
        }
        const targetSpan = findChunkFromRange(range);

        if (targetSpan) {
            const isNameSpan = targetSpan.classList.contains('tm-name');
            const originalText = targetSpan.dataset.orig;
            const translatedText = isNameSpan ? targetSpan.textContent : targetSpan.textContent;

            console.log(`Đã tìm thấy khối dịch. Gốc: ${originalText}`);
            showEditModal(originalText, translatedText, { readerTheme: isReaderSelection });
            return;
        }

        if (!isReaderSelection) {
            alert('Không tìm thấy khối dữ liệu dịch tương ứng. Hãy thử bôi đen chính xác hơn một chút.');
            return;
        }

        if (!selectedText) {
            alert('Không tìm thấy khối dữ liệu dịch tương ứng. Hãy thử bôi đen chính xác hơn một chút.');
            return;
        }

        const currentNameSet = config.nameSets[config.activeNameSet] || {};
        const hasCjk = /[\u4e00-\u9fff]/.test(selectedText);
        let chinese = '';
        let vietnamese = '';

        if (hasCjk) {
            chinese = selectedText;
            vietnamese = currentNameSet[chinese] || '';
        } else {
            vietnamese = selectedText;
            const lowered = vietnamese.toLowerCase();
            let matchKey = null;
            for (const [k, v] of Object.entries(currentNameSet)) {
                if (!v) continue;
                if (v === vietnamese || v.toLowerCase() === lowered) {
                    matchKey = k;
                    break;
                }
                const parts = v.split('/').map(p => p.trim()).filter(Boolean);
                if (parts.some(p => p === vietnamese || p.toLowerCase() === lowered)) {
                    matchKey = k;
                    break;
                }
            }
            if (matchKey) chinese = matchKey;
        }

        showEditModal(chinese, vietnamese, { readerTheme: isReaderSelection });
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
        tmUIRoot.appendChild(wrapper);

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
                const finalHtml = highlightNamesInText(finalText, newNameSet, plan.originalChinese);
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
        if (tmEl('tm-style-panel')) {
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

        tmUIRoot.appendChild(panel);

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


        tmUIRoot.appendChild(wrapper);

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
        const localDictResults = tmEl('tm-local-dict-results');
        const pageInfo = tmEl('tm-local-page-info');
        const prevBtn = tmEl('tm-local-prev-btn');
        const nextBtn = tmEl('tm-local-next-btn');

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
        tmUIRoot.insertAdjacentHTML('beforeend', modalHtml);

        const modal = tmEl(modalId);
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
    function openSettingsUI(initialTab) {
        removeElementById('tm-settings-modal');
        config = loadConfig();
        ensureServerEndpointStore();
        const oldNameSetSnapshot = JSON.parse(JSON.stringify(config.nameSets[config.activeNameSet] || {}));

        const configSnapshot = JSON.stringify(config);
        let isSaving = false;

        const currentProvider = config.serverProvider || 'dichngay';
        const serverEndpointsForUi = config.serverEndpoints || {};
        const currentServerUrl = escapeHtml(serverEndpointsForUi[currentProvider] || SERVER_PROVIDER_DEFAULTS[currentProvider] || SERVER_PROVIDER_DEFAULTS.dichngay);
        const ttsSettings = loadTtsSettings();
        const ttsSettingsSnapshot = JSON.stringify(ttsSettings);

        const wrapper = document.createElement('div');
        wrapper.id = 'tm-settings-modal';
        wrapper.className = 'tm-modal-wrapper';
        wrapper.style.zIndex = '2147483670';

        const isBlocked = checkBlacklistStatus();
        const hiddenStyle = isBlocked ? 'display: none !important;' : '';
        const validTabs = ['namesets', 'general', 'library', 'tts', 'ocr', 'advanced', 'blacklist', 'localedit'];
        const preferredTab = (!isBlocked && typeof initialTab === 'string' && validTabs.includes(initialTab)) ? initialTab : null;
        const defaultTab = isBlocked ? 'blacklist' : (preferredTab || 'namesets');
        const activeClass = (tab) => tab === defaultTab ? 'active' : '';

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
            <button class="tm-tab-btn ${activeClass('library')}" data-tab="library" style="${hiddenStyle}">Thư viện</button>
            <button class="tm-tab-btn ${activeClass('tts')}" data-tab="tts" style="${hiddenStyle}">TTS</button>
            <button class="tm-tab-btn ${activeClass('ocr')}" data-tab="ocr" style="${hiddenStyle}">OCR</button>
            <button class="tm-tab-btn ${activeClass('advanced')}" data-tab="advanced" style="${hiddenStyle}">Nâng cao</button>
            <button class="tm-tab-btn ${activeClass('blacklist')}" data-tab="blacklist">Blacklist</button>
            <button class="tm-tab-btn ${activeClass('localedit')}" data-tab="localedit" style="${hiddenStyle}">Từ điển Local</button>
            <button class="tm-tab-btn" id="tm-settings-guide-btn" style="margin-left:auto; color:#6a1b9a; font-weight:600;">📖 Hướng dẫn</button>
        </div>
        <div class="tm-modal-content">
            <!-- Name Sets Tab -->
            <div id="tab-namesets" class="tm-tab-content ${activeClass('namesets')}">
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
            <div id="tab-general" class="tm-tab-content ${activeClass('general')}">
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
                         <p style="font-size:12px; color:#a05a00; background:#fff3cd; padding:6px 8px; border-radius:4px; margin:6px 0 0;">
                             <b>Lưu ý:</b> Allow Copy can thiệp khá gắt để phá chặn copy trên web cứng đầu. Trên mobile, nhất là khi đọc trong Thư viện, nó có thể làm thao tác tô đen không ổn định. Nếu chỉ cần Edit Name thì nên tắt mục này.
                         </p>
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
                     <input type="checkbox" id="tm-show-help-btn" style="margin-right: 5px;" />
                     Hiển thị nút "Hướng dẫn" (?) trên trang
                </label>
                <p style="font-size:13px; color:#555">Bật/tắt nút ? ở góc trái trên màn hình để xem hướng dẫn.</p>
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
            <!-- Library Tab -->
            <div id="tab-library" class="tm-tab-content ${activeClass('library')}">
                <label class="tm-label">Prefetch chương sau khi đọc đến (%)</label>
                <div style="display:flex; align-items:center; gap:12px;">
                    <input id="tm-lib-prefetch" type="range" min="10" max="90" step="5" value="${config.readerPrefetchPercent || 50}" style="flex:1;">
                    <div id="tm-lib-prefetch-value" style="min-width:48px; font-weight:600;">${config.readerPrefetchPercent || 50}%</div>
                </div>
                <p style="font-size:13px; color:#555">Khi đọc vượt mức này, script sẽ dịch ngầm chương kế tiếp (nếu chưa có cache).</p>
                <label class="tm-label" style="margin-top: 12px;">
                    <input type="checkbox" id="tm-show-library-btn" style="margin-right: 6px;" />
                    Hiển thị nút "Thư viện" trên trang
	                </label>
	                <p style="font-size:13px; color:#555">Hiển thị nút nổi để mở thư viện nhanh.</p>
	                <p style="font-size:13px; color:#555">Sao lưu Thư viện hiện dùng file backup tải xuống, phù hợp cả mobile. Bấm <b>Sao lưu</b> trong Thư viện để tải file, bấm <b>Khôi phục</b> để nhập lại file đó.</p>
	                <hr style="margin: 16px 0; border: none; border-top: 1px solid #eee;">
	                <label class="tm-label">Kiểu đọc chương</label>
                <select id="tm-reader-mode" class="tm-select">
                    <option value="single">Theo chương (một chương một trang)</option>
                    <option value="vertical">Cuộn dọc liên tục</option>
                </select>
                <label class="tm-label" style="margin-top: 12px;">Giao diện đọc</label>
                <div class="tm-row">
                    <div class="tm-col">
                        <label class="tm-label">Font chữ</label>
                        <select id="tm-reader-font" class="tm-select">
                            <option value="Noto Serif, 'Times New Roman', serif">Noto Serif (Mặc định)</option>
                            <option value="Arial, 'Helvetica Neue', sans-serif">Arial</option>
                            <option value="'Times New Roman', Times, serif">Times New Roman</option>
                            <option value="Verdana, Geneva, sans-serif">Verdana</option>
                            <option value="'Segoe UI', Tahoma, sans-serif">Segoe UI</option>
                        </select>
                    </div>
                    <div class="tm-col">
                        <label class="tm-label">Cỡ chữ</label>
                        <input id="tm-reader-font-size" type="number" min="12" max="40" class="tm-input" value="${config.readerStyle?.fontSize || 18}">
                    </div>
	                    <div class="tm-col">
	                        <label class="tm-label">Giãn dòng</label>
	                        <input id="tm-reader-line-height" type="number" step="0.1" min="1.2" max="3" class="tm-input" value="${config.readerStyle?.lineHeight || 1.9}">
	                    </div>
		                    <div class="tm-col">
		                        <label class="tm-label">Dãn đoạn (px)</label>
		                        <input id="tm-reader-paragraph-spacing" type="number" min="0" max="80" class="tm-input" value="${config.readerStyle?.paragraphSpacing ?? 12}">
		                    </div>
		                    <div class="tm-col">
		                        <label class="tm-label">Thụt dòng (em)</label>
		                        <input id="tm-reader-indent" type="number" step="0.1" min="0" max="8" class="tm-input" value="${config.readerStyle?.textIndent ?? DEFAULT_CONFIG.readerStyle.textIndent}">
		                    </div>
		                </div>
		                <div class="tm-row">
                    <div class="tm-col">
                        <label class="tm-label">Màu nền</label>
                        <input id="tm-reader-bg" type="color" class="tm-input" value="${config.readerStyle?.bgColor || '#f7f4ee'}">
                    </div>
                    <div class="tm-col">
                        <label class="tm-label">Màu chữ</label>
                        <input id="tm-reader-text-color" type="color" class="tm-input" value="${config.readerStyle?.textColor || '#1f1f1f'}">
	                    </div>
	                    <div class="tm-col">
	                        <label class="tm-label">Lề hai bên (px)</label>
	                        <input id="tm-reader-padding" type="number" min="0" max="240" class="tm-input" value="${config.readerStyle?.paddingX ?? 18}">
	                    </div>
                    <div class="tm-col">
                        <label class="tm-label">Căn lề</label>
                        <select id="tm-reader-align" class="tm-select">
                            <option value="left">Trái</option>
                            <option value="right">Phải</option>
                            <option value="center">Giữa</option>
                            <option value="justify">Đều 2 bên</option>
                        </select>
                    </div>
                </div>
                <div style="margin-top: 12px; display:flex; justify-content:flex-end;">
                    <button id="tm-reader-reset" class="tm-btn">Mặc định</button>
                </div>
            </div>
            <!-- TTS Tab -->
            <div id="tab-tts" class="tm-tab-content ${activeClass('tts')}">
                <label class="tm-label">Nguồn phát</label>
                <select id="tm-tts-provider" class="tm-select">
                    <option value="browser">Browser Web Speech</option>
                    <option value="tiktok">TikTok</option>
                    <option value="google">Google Translate</option>
                    <option value="gemini">Gemini</option>
                    <option value="bing">Bing</option>
                    <option value="zalo">Zalo AI</option>
                </select>
                <p id="tm-tts-provider-note" style="font-size:13px; color:#555">Dùng cho nút Phát trong reader: phát từ vị trí bôi đen tới hết chương/truyện.</p>
                <div class="tm-row">
                    <div class="tm-col">
                        <label class="tm-label">Giọng đọc</label>
                        <select id="tm-tts-voice" class="tm-select"></select>
                    </div>
                    <div style="align-self:flex-end; display:flex; gap:8px; margin-bottom:12px;">
                        <button id="tm-tts-refresh-voices" class="tm-btn" type="button">Làm mới giọng</button>
                    </div>
                </div>
                <div id="tm-tts-tiktok-auth" style="display:none; padding:10px 12px; border:1px solid #eee; border-radius:6px; background:#fafafa; margin-bottom:12px;">
                    <label class="tm-label" style="margin-top:0;">Cookie TikTok</label>
                    <p id="tm-tts-tiktok-cookie-info" style="font-size:13px; color:#555; margin:4px 0 10px;">Chưa có cookie.</p>
                    <div style="display:flex; gap:8px; flex-wrap:wrap;">
                        <button id="tm-tts-tiktok-cookie-btn" class="tm-btn" type="button">Nhập/sửa cookie</button>
                        <button id="tm-tts-tiktok-cookie-clear" class="tm-btn" type="button">Xóa cookie</button>
                        <button id="tm-tts-open-tiktok" class="tm-btn" type="button">Mở TikTok</button>
                    </div>
                </div>
                <div id="tm-tts-zalo-auth" style="display:none; padding:10px 12px; border:1px solid #eee; border-radius:6px; background:#fafafa; margin-bottom:12px;">
                    <label class="tm-label" style="margin-top:0;">API key Zalo</label>
                    <p id="tm-tts-zalo-api-info" style="font-size:13px; color:#555; margin:4px 0 10px;">Chưa có API key.</p>
                    <div style="display:flex; gap:8px; flex-wrap:wrap;">
                        <button id="tm-tts-zalo-api-btn" class="tm-btn" type="button">Nhập/sửa API key</button>
                        <button id="tm-tts-zalo-api-clear" class="tm-btn" type="button">Xóa API key</button>
                    </div>
                </div>
                <div class="tm-row">
                    <div class="tm-col">
                        <label class="tm-label">Tốc độ (<span id="tm-tts-rate-value">${ttsSettings.rate.toFixed(2)}</span>)</label>
                        <input id="tm-tts-rate" type="range" min="${TTS_LIMITS.rate[0]}" max="${TTS_LIMITS.rate[1]}" step="0.1" value="${ttsSettings.rate}" style="width:100%;">
                    </div>
                    <div class="tm-col">
                        <label class="tm-label">Cao độ (<span id="tm-tts-pitch-value">${ttsSettings.pitch.toFixed(2)}</span>)</label>
                        <input id="tm-tts-pitch" type="range" min="${TTS_LIMITS.pitch[0]}" max="${TTS_LIMITS.pitch[1]}" step="0.05" value="${ttsSettings.pitch}" style="width:100%;">
                    </div>
                    <div class="tm-col">
                        <label class="tm-label">Âm lượng (<span id="tm-tts-volume-value">${ttsSettings.volume.toFixed(2)}</span>)</label>
                        <input id="tm-tts-volume" type="range" min="${TTS_LIMITS.volume[0]}" max="${TTS_LIMITS.volume[1]}" step="0.05" value="${ttsSettings.volume}" style="width:100%;">
                    </div>
                </div>
                <div class="tm-row">
                    <div class="tm-col">
                        <label class="tm-label">Ký tự tối đa mỗi đoạn</label>
                        <input id="tm-tts-max-chars" type="number" class="tm-input" min="${TTS_LIMITS.maxChars[0]}" max="${TTS_LIMITS.maxChars[1]}" step="10" value="${ttsSettings.maxChars}">
                    </div>
                    <div class="tm-col">
                        <label class="tm-label">Delay giữa đoạn (ms)</label>
                        <input id="tm-tts-segment-delay" type="number" class="tm-input" min="${TTS_LIMITS.segmentDelayMs[0]}" max="${TTS_LIMITS.segmentDelayMs[1]}" step="50" value="${ttsSettings.segmentDelayMs}">
                    </div>
                    <div class="tm-col">
                        <label class="tm-label" style="font-weight:normal;">
                            <input type="checkbox" id="tm-tts-sleep-enabled" style="margin-right:6px;">
                            Bật hẹn giờ ngủ
                        </label>
                        <input id="tm-tts-sleep-timer" type="number" class="tm-input" min="${TTS_LIMITS.sleepTimerMinutes[0]}" max="${TTS_LIMITS.sleepTimerMinutes[1]}" step="1" value="${ttsSettings.sleepTimerMinutes}" ${ttsSettings.sleepTimerEnabled ? '' : 'disabled'}>
                    </div>
                </div>
                <details open style="margin-top: 8px;">
                    <summary style="cursor:pointer; font-weight:600; color:#333;">Remote TTS</summary>
                    <div class="tm-row" style="margin-top:10px;">
                        <div class="tm-col">
                            <label class="tm-label" style="font-weight:normal;">
                                <input type="checkbox" id="tm-tts-prefetch-enabled" style="margin-right:6px;">
                                Prefetch audio đoạn kế tiếp
                            </label>
                        </div>
                        <div class="tm-col">
                            <label class="tm-label">Số đoạn prefetch</label>
                            <input id="tm-tts-prefetch-count" type="number" class="tm-input" min="${TTS_LIMITS.prefetchCount[0]}" max="${TTS_LIMITS.prefetchCount[1]}" step="1" value="${ttsSettings.prefetchCount}">
                        </div>
                    </div>
                    <div class="tm-row">
                        <div class="tm-col">
                            <label class="tm-label">Timeout request (ms)</label>
                            <input id="tm-tts-remote-timeout" type="number" class="tm-input" min="${TTS_LIMITS.remoteTimeoutMs[0]}" max="${TTS_LIMITS.remoteTimeoutMs[1]}" step="1000" value="${ttsSettings.remoteTimeoutMs}">
                        </div>
                        <div class="tm-col">
                            <label class="tm-label">Retry</label>
                            <input id="tm-tts-remote-retries" type="number" class="tm-input" min="${TTS_LIMITS.remoteRetries[0]}" max="${TTS_LIMITS.remoteRetries[1]}" step="1" value="${ttsSettings.remoteRetries}">
                        </div>
                        <div class="tm-col">
                            <label class="tm-label">Giãn request (ms)</label>
                            <input id="tm-tts-remote-gap" type="number" class="tm-input" min="${TTS_LIMITS.remoteMinGapMs[0]}" max="${TTS_LIMITS.remoteMinGapMs[1]}" step="50" value="${ttsSettings.remoteMinGapMs}">
                        </div>
                    </div>
                </details>
                <details style="margin-top: 8px;">
                    <summary style="cursor:pointer; font-weight:600; color:#333;">Thay thế từ khi đọc</summary>
                    <label class="tm-label" style="font-weight:normal; margin-top:10px;">
                        <input type="checkbox" id="tm-tts-replace-enabled" style="margin-right:6px;">
                        Bật thay thế trước khi phát TTS
                    </label>
                    <textarea id="tm-tts-replace-rules" class="tm-textarea" rows="6" spellcheck="false" placeholder="幽山 => U sơn&#10;từ gốc = từ đọc"></textarea>
                    <p style="font-size:12px; color:#555; margin-top:-8px;">Mỗi dòng một luật, dùng <code>=</code>, <code>=&gt;</code> hoặc tab để tách từ gốc và từ đọc.</p>
                </details>
                <details style="margin-top: 8px;">
                    <summary style="cursor:pointer; font-weight:600; color:#333;">Tùy chọn reader</summary>
                    <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:8px 16px; margin-top:10px;">
                        <label class="tm-label" style="font-weight:normal;"><input type="checkbox" id="tm-tts-include-title" style="margin-right:6px;">Đọc tiêu đề khi reader hỗ trợ</label>
                        <label class="tm-label" style="font-weight:normal;"><input type="checkbox" id="tm-tts-auto-next" style="margin-right:6px;">Tự qua đoạn/chương khi reader hỗ trợ</label>
                        <label class="tm-label" style="font-weight:normal;"><input type="checkbox" id="tm-tts-auto-scroll" style="margin-right:6px;">Tự cuộn khi reader hỗ trợ</label>
                        <label class="tm-label" style="font-weight:normal;"><input type="checkbox" id="tm-tts-auto-start-next" style="margin-right:6px;">Tự đọc chương kế khi reader hỗ trợ</label>
                    </div>
                </details>
                <div style="margin-top: 12px; display:flex; justify-content:flex-end; gap:8px; flex-wrap:wrap;">
                    <button id="tm-tts-test" class="tm-btn" type="button">Thử giọng</button>
                    <button id="tm-tts-stop" class="tm-btn" type="button">Dừng phát</button>
                    <button id="tm-tts-clear-cache" class="tm-btn" type="button">Xóa cache audio</button>
                    <button id="tm-tts-reset" class="tm-btn" type="button">Mặc định</button>
                </div>
                <div id="tm-tts-secret-modal" class="tm-modal-wrapper" style="display:none; z-index:2147483650;">
                    <div class="tm-modal-backdrop"></div>
                    <div class="tm-modal-box" style="width:min(560px, calc(100vw - 24px));">
                        <div class="tm-modal-header">
                            <h3 id="tm-tts-secret-title">Nhập dữ liệu TTS</h3>
                            <button id="tm-tts-secret-close" class="tm-btn" type="button">&times;</button>
                        </div>
                        <div class="tm-modal-content">
                            <p id="tm-tts-secret-message" style="font-size:13px; color:#555; margin-top:0;"></p>
                            <textarea id="tm-tts-secret-text" class="tm-textarea" rows="8" spellcheck="false"></textarea>
                        </div>
                        <div class="tm-modal-footer">
                            <button id="tm-tts-secret-cancel" class="tm-btn" type="button">Hủy</button>
                            <button id="tm-tts-secret-save" class="tm-btn tm-btn-primary" type="button">Lưu</button>
                        </div>
                    </div>
                </div>
            </div>
            <!-- OCR Tab -->
            <div id="tab-ocr" class="tm-tab-content ${activeClass('ocr')}">
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
            <div id="tab-advanced" class="tm-tab-content ${activeClass('advanced')}">
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
                <div class="tm-row">
                    <div class="tm-col"><label class="tm-label">Số lần retry khi lỗi</label><input id="tm-retry" type="number" min="0" max="10" class="tm-input" value="${config.retryCount ?? 3}" /></div>
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
            <div id="tab-localedit" class="tm-tab-content ${activeClass('localedit')}">
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
        const libPrefetchRange = wrapper.querySelector('#tm-lib-prefetch');
        const libPrefetchValue = wrapper.querySelector('#tm-lib-prefetch-value');
        const showLibraryBtnCheckbox = wrapper.querySelector('#tm-show-library-btn');
        const libBackupIntervalInput = wrapper.querySelector('#tm-lib-backup-interval');
        const readerModeSelect = wrapper.querySelector('#tm-reader-mode');
        const readerFontSelect = wrapper.querySelector('#tm-reader-font');
        const readerFontSizeInput = wrapper.querySelector('#tm-reader-font-size');
        const readerLineHeightInput = wrapper.querySelector('#tm-reader-line-height');
        const readerParagraphSpacingInput = wrapper.querySelector('#tm-reader-paragraph-spacing');
        const readerIndentInput = wrapper.querySelector('#tm-reader-indent');
        const readerBgInput = wrapper.querySelector('#tm-reader-bg');
        const readerTextColorInput = wrapper.querySelector('#tm-reader-text-color');
        const readerPaddingInput = wrapper.querySelector('#tm-reader-padding');
        const readerAlignSelect = wrapper.querySelector('#tm-reader-align');
        const readerResetBtn = wrapper.querySelector('#tm-reader-reset');
        const ttsProviderSelect = wrapper.querySelector('#tm-tts-provider');
        const ttsVoiceSelect = wrapper.querySelector('#tm-tts-voice');
        const ttsRefreshVoicesBtn = wrapper.querySelector('#tm-tts-refresh-voices');
        const ttsRateInput = wrapper.querySelector('#tm-tts-rate');
        const ttsPitchInput = wrapper.querySelector('#tm-tts-pitch');
        const ttsVolumeInput = wrapper.querySelector('#tm-tts-volume');
        const ttsRateValue = wrapper.querySelector('#tm-tts-rate-value');
        const ttsPitchValue = wrapper.querySelector('#tm-tts-pitch-value');
        const ttsVolumeValue = wrapper.querySelector('#tm-tts-volume-value');
        const ttsMaxCharsInput = wrapper.querySelector('#tm-tts-max-chars');
        const ttsSegmentDelayInput = wrapper.querySelector('#tm-tts-segment-delay');
        const ttsSleepEnabledInput = wrapper.querySelector('#tm-tts-sleep-enabled');
        const ttsSleepTimerInput = wrapper.querySelector('#tm-tts-sleep-timer');
        const ttsProviderNote = wrapper.querySelector('#tm-tts-provider-note');
        const ttsTikTokAuth = wrapper.querySelector('#tm-tts-tiktok-auth');
        const ttsTikTokCookieInfo = wrapper.querySelector('#tm-tts-tiktok-cookie-info');
        const ttsTikTokCookieBtn = wrapper.querySelector('#tm-tts-tiktok-cookie-btn');
        const ttsTikTokCookieClearBtn = wrapper.querySelector('#tm-tts-tiktok-cookie-clear');
        const ttsOpenTikTokBtn = wrapper.querySelector('#tm-tts-open-tiktok');
        const ttsZaloAuth = wrapper.querySelector('#tm-tts-zalo-auth');
        const ttsZaloApiInfo = wrapper.querySelector('#tm-tts-zalo-api-info');
        const ttsZaloApiBtn = wrapper.querySelector('#tm-tts-zalo-api-btn');
        const ttsZaloApiClearBtn = wrapper.querySelector('#tm-tts-zalo-api-clear');
        const ttsPrefetchEnabledInput = wrapper.querySelector('#tm-tts-prefetch-enabled');
        const ttsPrefetchCountInput = wrapper.querySelector('#tm-tts-prefetch-count');
        const ttsRemoteTimeoutInput = wrapper.querySelector('#tm-tts-remote-timeout');
        const ttsRemoteRetriesInput = wrapper.querySelector('#tm-tts-remote-retries');
        const ttsRemoteGapInput = wrapper.querySelector('#tm-tts-remote-gap');
        const ttsReplaceEnabledInput = wrapper.querySelector('#tm-tts-replace-enabled');
        const ttsReplaceRulesInput = wrapper.querySelector('#tm-tts-replace-rules');
        const ttsIncludeTitleInput = wrapper.querySelector('#tm-tts-include-title');
        const ttsAutoNextInput = wrapper.querySelector('#tm-tts-auto-next');
        const ttsAutoScrollInput = wrapper.querySelector('#tm-tts-auto-scroll');
        const ttsAutoStartNextInput = wrapper.querySelector('#tm-tts-auto-start-next');
        const ttsTestBtn = wrapper.querySelector('#tm-tts-test');
        const ttsStopBtn = wrapper.querySelector('#tm-tts-stop');
        const ttsClearCacheBtn = wrapper.querySelector('#tm-tts-clear-cache');
        const ttsResetBtn = wrapper.querySelector('#tm-tts-reset');
        const ttsSecretModal = wrapper.querySelector('#tm-tts-secret-modal');
        const ttsSecretTitle = wrapper.querySelector('#tm-tts-secret-title');
        const ttsSecretMessage = wrapper.querySelector('#tm-tts-secret-message');
        const ttsSecretText = wrapper.querySelector('#tm-tts-secret-text');
        const ttsSecretSaveBtn = wrapper.querySelector('#tm-tts-secret-save');
        const ttsSecretCancelBtn = wrapper.querySelector('#tm-tts-secret-cancel');
        const ttsSecretCloseBtn = wrapper.querySelector('#tm-tts-secret-close');
        let ttsWorkingSettings = normalizeTtsSettings(ttsSettings);
        let ttsSecretMode = '';

        const readNumberInput = (selector, fallback, min, max, integer = false) => {
            const raw = wrapper.querySelector(selector)?.value;
            const n = integer ? parseInt(raw, 10) : parseFloat(raw);
            if (!Number.isFinite(n)) return fallback;
            return Math.min(max, Math.max(min, n));
        };
        const readReaderStyleFromUI = () => ({
            fontFamily: wrapper.querySelector('#tm-reader-font')?.value || DEFAULT_CONFIG.readerStyle.fontFamily,
            fontSize: readNumberInput('#tm-reader-font-size', DEFAULT_CONFIG.readerStyle.fontSize, 12, 40, true),
            lineHeight: readNumberInput('#tm-reader-line-height', DEFAULT_CONFIG.readerStyle.lineHeight, 1.2, 3),
            paragraphSpacing: readNumberInput('#tm-reader-paragraph-spacing', DEFAULT_CONFIG.readerStyle.paragraphSpacing, 0, 80, true),
            textIndent: readNumberInput('#tm-reader-indent', DEFAULT_CONFIG.readerStyle.textIndent, 0, 8),
            bgColor: wrapper.querySelector('#tm-reader-bg')?.value || DEFAULT_CONFIG.readerStyle.bgColor,
            textColor: wrapper.querySelector('#tm-reader-text-color')?.value || DEFAULT_CONFIG.readerStyle.textColor,
            paddingX: readNumberInput('#tm-reader-padding', DEFAULT_CONFIG.readerStyle.paddingX, 0, 240, true),
            textAlign: wrapper.querySelector('#tm-reader-align')?.value || DEFAULT_CONFIG.readerStyle.textAlign
        });
        const readTtsSettingsFromUI = () => {
            const provider = ttsProviderSelect?.value || TTS_DEFAULT_SETTINGS.provider;
            const next = {
                ...ttsWorkingSettings,
                provider,
                rate: readNumberInput('#tm-tts-rate', TTS_DEFAULT_SETTINGS.rate, TTS_LIMITS.rate[0], TTS_LIMITS.rate[1]),
                pitch: readNumberInput('#tm-tts-pitch', TTS_DEFAULT_SETTINGS.pitch, TTS_LIMITS.pitch[0], TTS_LIMITS.pitch[1]),
                volume: readNumberInput('#tm-tts-volume', TTS_DEFAULT_SETTINGS.volume, TTS_LIMITS.volume[0], TTS_LIMITS.volume[1]),
                maxChars: readNumberInput('#tm-tts-max-chars', TTS_DEFAULT_SETTINGS.maxChars, TTS_LIMITS.maxChars[0], TTS_LIMITS.maxChars[1], true),
                segmentDelayMs: readNumberInput('#tm-tts-segment-delay', TTS_DEFAULT_SETTINGS.segmentDelayMs, TTS_LIMITS.segmentDelayMs[0], TTS_LIMITS.segmentDelayMs[1], true),
                sleepTimerEnabled: !!ttsSleepEnabledInput?.checked,
                sleepTimerMinutes: readNumberInput('#tm-tts-sleep-timer', TTS_DEFAULT_SETTINGS.sleepTimerMinutes, TTS_LIMITS.sleepTimerMinutes[0], TTS_LIMITS.sleepTimerMinutes[1], true),
                prefetchEnabled: !!ttsPrefetchEnabledInput?.checked,
                prefetchCount: readNumberInput('#tm-tts-prefetch-count', TTS_DEFAULT_SETTINGS.prefetchCount, TTS_LIMITS.prefetchCount[0], TTS_LIMITS.prefetchCount[1], true),
                remoteTimeoutMs: readNumberInput('#tm-tts-remote-timeout', TTS_DEFAULT_SETTINGS.remoteTimeoutMs, TTS_LIMITS.remoteTimeoutMs[0], TTS_LIMITS.remoteTimeoutMs[1], true),
                remoteRetries: readNumberInput('#tm-tts-remote-retries', TTS_DEFAULT_SETTINGS.remoteRetries, TTS_LIMITS.remoteRetries[0], TTS_LIMITS.remoteRetries[1], true),
                remoteMinGapMs: readNumberInput('#tm-tts-remote-gap', TTS_DEFAULT_SETTINGS.remoteMinGapMs, TTS_LIMITS.remoteMinGapMs[0], TTS_LIMITS.remoteMinGapMs[1], true),
                replaceEnabled: !!ttsReplaceEnabledInput?.checked,
                replaceRules: parseTtsReplaceRulesText(ttsReplaceRulesInput?.value || ''),
                includeTitle: !!ttsIncludeTitleInput?.checked,
                autoNext: !!ttsAutoNextInput?.checked,
                autoScroll: !!ttsAutoScrollInput?.checked,
                autoStartOnNextChapter: !!ttsAutoStartNextInput?.checked
            };
            const voiceKey = getTtsProviderVoiceKey(provider);
            next[voiceKey] = ttsVoiceSelect?.value || '';
            return normalizeTtsSettings(next);
        };
        const updateTtsRangeLabels = () => {
            if (ttsRateValue) ttsRateValue.textContent = (parseFloat(ttsRateInput?.value) || TTS_DEFAULT_SETTINGS.rate).toFixed(2);
            if (ttsPitchValue) ttsPitchValue.textContent = (parseFloat(ttsPitchInput?.value) || TTS_DEFAULT_SETTINGS.pitch).toFixed(2);
            if (ttsVolumeValue) ttsVolumeValue.textContent = (parseFloat(ttsVolumeInput?.value) || TTS_DEFAULT_SETTINGS.volume).toFixed(2);
        };
        const populateTtsProviders = (selectedProvider = '') => {
            if (!ttsProviderSelect) return;
            const providers = getTtsProviderList();
            ttsProviderSelect.innerHTML = '';
            providers.forEach((provider) => {
                const option = document.createElement('option');
                option.value = provider.id;
                option.textContent = provider.label || provider.id;
                ttsProviderSelect.appendChild(option);
            });
            if (selectedProvider && !providers.some(p => p.id === selectedProvider)) {
                const option = document.createElement('option');
                option.value = selectedProvider;
                option.textContent = selectedProvider;
                ttsProviderSelect.appendChild(option);
            }
            ttsProviderSelect.value = selectedProvider || TTS_DEFAULT_SETTINGS.provider;
        };
        const populateTtsVoices = (providerId = 'browser', selectedVoiceId = '') => {
            if (!ttsVoiceSelect) return;
            const provider = providerId || 'browser';
            const voices = getTtsVoices(provider);
            ttsVoiceSelect.innerHTML = '';
            const autoOption = document.createElement('option');
            autoOption.value = '';
            autoOption.textContent = 'Tự động';
            ttsVoiceSelect.appendChild(autoOption);
            voices.forEach((voice) => {
                const option = document.createElement('option');
                option.value = voice.id || voice.voiceURI || '';
                option.textContent = formatTtsVoiceLabel(voice);
                ttsVoiceSelect.appendChild(option);
            });
            if (selectedVoiceId && !voices.some(v => (v.id || v.voiceURI) === selectedVoiceId)) {
                const missing = document.createElement('option');
                missing.value = selectedVoiceId;
                missing.textContent = `Đã lưu: ${selectedVoiceId}`;
                ttsVoiceSelect.appendChild(missing);
            }
            ttsVoiceSelect.value = selectedVoiceId || '';
        };
        const updateTtsSecretInfo = (settings = ttsWorkingSettings) => {
            const core = getTtsCore();
            const cookieRaw = String(settings.tiktokCookieText || '');
            const cookieParsed = core && typeof core.parseTikTokCookieInput === 'function'
                ? core.parseTikTokCookieInput(cookieRaw)
                : { header: cookieRaw, hasSession: /(?:^|;\s*)(sessionid|sid_tt|sid_guard)=/i.test(cookieRaw), format: 'header' };
            if (ttsTikTokCookieInfo) {
                ttsTikTokCookieInfo.textContent = cookieRaw
                    ? (cookieParsed.hasSession ? `Đã lưu cookie (ẩn). Định dạng: ${cookieParsed.format || 'header'}.` : 'Đã lưu cookie nhưng thiếu sessionid/sid_tt/sid_guard.')
                    : 'Chưa có cookie.';
            }
            const keys = core && typeof core.parseZaloApiKeys === 'function'
                ? core.parseZaloApiKeys(settings.zaloApiKeysText)
                : String(settings.zaloApiKeysText || '').split(/[\r\n,;]+/).filter(Boolean);
            if (ttsZaloApiInfo) {
                ttsZaloApiInfo.textContent = keys.length ? `Đã lưu ${keys.length} API key.` : 'Chưa có API key.';
            }
        };
        const updateTtsProviderUi = (settings = ttsWorkingSettings) => {
            const provider = settings.provider || 'browser';
            if (ttsProviderNote) ttsProviderNote.textContent = describeTtsProvider(provider);
            if (ttsTikTokAuth) ttsTikTokAuth.style.display = provider === 'tiktok' ? 'block' : 'none';
            if (ttsZaloAuth) ttsZaloAuth.style.display = provider === 'zalo' ? 'block' : 'none';
            updateTtsSecretInfo(settings);
        };
        const applyTtsSettingsToUI = (settings) => {
            const normalized = normalizeTtsSettings(settings);
            ttsWorkingSettings = normalized;
            populateTtsProviders(normalized.provider);
            populateTtsVoices(normalized.provider, getTtsVoiceValue(normalized, normalized.provider));
            if (ttsRateInput) ttsRateInput.value = normalized.rate;
            if (ttsPitchInput) ttsPitchInput.value = normalized.pitch;
            if (ttsVolumeInput) ttsVolumeInput.value = normalized.volume;
            if (ttsMaxCharsInput) ttsMaxCharsInput.value = normalized.maxChars;
            if (ttsSegmentDelayInput) ttsSegmentDelayInput.value = normalized.segmentDelayMs;
            if (ttsSleepEnabledInput) ttsSleepEnabledInput.checked = !!normalized.sleepTimerEnabled;
            if (ttsSleepTimerInput) ttsSleepTimerInput.value = normalized.sleepTimerMinutes;
            if (ttsSleepTimerInput) ttsSleepTimerInput.disabled = !normalized.sleepTimerEnabled;
            if (ttsPrefetchEnabledInput) ttsPrefetchEnabledInput.checked = !!normalized.prefetchEnabled;
            if (ttsPrefetchCountInput) ttsPrefetchCountInput.value = normalized.prefetchCount;
            if (ttsRemoteTimeoutInput) ttsRemoteTimeoutInput.value = normalized.remoteTimeoutMs;
            if (ttsRemoteRetriesInput) ttsRemoteRetriesInput.value = normalized.remoteRetries;
            if (ttsRemoteGapInput) ttsRemoteGapInput.value = normalized.remoteMinGapMs;
            if (ttsReplaceEnabledInput) ttsReplaceEnabledInput.checked = !!normalized.replaceEnabled;
            if (ttsReplaceRulesInput) ttsReplaceRulesInput.value = formatTtsReplaceRulesText(normalized.replaceRules);
            if (ttsIncludeTitleInput) ttsIncludeTitleInput.checked = !!normalized.includeTitle;
            if (ttsAutoNextInput) ttsAutoNextInput.checked = !!normalized.autoNext;
            if (ttsAutoScrollInput) ttsAutoScrollInput.checked = !!normalized.autoScroll;
            if (ttsAutoStartNextInput) ttsAutoStartNextInput.checked = !!normalized.autoStartOnNextChapter;
            updateTtsProviderUi(normalized);
            updateTtsRangeLabels();
        };
        const closeTtsSecretModal = () => {
            if (ttsSecretModal) ttsSecretModal.style.display = 'none';
            if (ttsSecretText) ttsSecretText.value = '';
            ttsSecretMode = '';
        };
        const openTtsSecretModal = (mode) => {
            ttsSecretMode = mode;
            if (!ttsSecretModal || !ttsSecretText) return;
            if (mode === 'zalo') {
                if (ttsSecretTitle) ttsSecretTitle.textContent = 'Nhập API key Zalo';
                if (ttsSecretMessage) ttsSecretMessage.textContent = 'Dán một hoặc nhiều API key Zalo AI, mỗi dòng một key.';
                ttsSecretText.placeholder = 'API key 1\nAPI key 2';
                ttsSecretText.value = String(ttsWorkingSettings.zaloApiKeysText || '');
            } else {
                if (ttsSecretTitle) ttsSecretTitle.textContent = 'Nhập Cookie TikTok';
                if (ttsSecretMessage) ttsSecretMessage.textContent = 'Dán Cookie header, JSON cookies hoặc Netscape cookie file. Cookie sẽ được lưu ẩn trong settings.';
                ttsSecretText.placeholder = 'Cookie: sessionid=...; sid_tt=...\nHoặc JSON/Netscape export từ Cookie-Editor';
                ttsSecretText.value = '';
            }
            ttsSecretModal.style.display = 'flex';
            setTimeout(() => ttsSecretText.focus(), 30);
        };
        const saveTtsSecretModal = () => {
            const raw = String(ttsSecretText?.value || '').trim();
            const core = getTtsCore();
            if (ttsSecretMode === 'zalo') {
                const keys = core && typeof core.parseZaloApiKeys === 'function'
                    ? core.parseZaloApiKeys(raw)
                    : raw.split(/[\r\n,;]+/).filter(Boolean);
                if (!keys.length) {
                    showNotification('Nhập ít nhất một API key Zalo.');
                    return;
                }
                ttsWorkingSettings = normalizeTtsSettings({ ...ttsWorkingSettings, zaloApiKeysText: raw });
                try {
                    saveTtsSettings({ ...loadTtsSettings(), zaloApiKeysText: raw });
                } catch (err) {
                    console.warn('[tm-translate] Không lưu API key Zalo ngay được:', err);
                }
                updateTtsProviderUi(ttsWorkingSettings);
                closeTtsSecretModal();
                showNotification('Đã cập nhật API key Zalo.');
                return;
            }
            const parsed = core && typeof core.parseTikTokCookieInput === 'function'
                ? core.parseTikTokCookieInput(raw)
                : { header: raw, hasSession: /(?:^|;\s*)(sessionid|sid_tt|sid_guard)=/i.test(raw) };
            if (!parsed.header) {
                showNotification('Cookie TikTok rỗng hoặc sai định dạng.');
                return;
            }
            if (!parsed.hasSession && !confirm('Cookie có vẻ thiếu sessionid/sid_tt/sid_guard. Vẫn lưu?')) {
                return;
            }
            ttsWorkingSettings = normalizeTtsSettings({ ...ttsWorkingSettings, tiktokCookieText: raw });
            try {
                saveTtsSettings({ ...loadTtsSettings(), tiktokCookieText: raw });
            } catch (err) {
                console.warn('[tm-translate] Không lưu cookie TikTok ngay được:', err);
            }
            updateTtsProviderUi(ttsWorkingSettings);
            closeTtsSecretModal();
            showNotification('Đã cập nhật cookie TikTok.');
        };
        const stopTtsPlayback = () => {
            const core = getTtsCore();
            if (core && typeof core.stop === 'function') {
                try { core.stop(); return; } catch (err) { /* ignore */ }
            }
            try { window.speechSynthesis?.cancel?.(); } catch (err) { /* ignore */ }
        };
        const playTtsPreview = () => {
            const settings = readTtsSettingsFromUI();
            ttsWorkingSettings = settings;
            const core = getTtsCore();
            try {
                if (core && typeof core.speakText === 'function') {
                    const result = core.speakText('Xin chào. Đây là thử giọng TTS.', {
                        provider: settings.provider || 'browser',
                        settings,
                        maxChars: settings.maxChars || TTS_DEFAULT_SETTINGS.maxChars,
                        title: 'TTS test',
                        artist: 'TM Translate'
                    });
                    if (!result || result.ok === false) throw new Error(result && result.reason ? result.reason : 'tts test failed');
                } else {
                    if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
                        showNotification('Trình duyệt chưa hỗ trợ phát thử TTS.');
                        return;
                    }
                    window.speechSynthesis.cancel();
                    const utterance = new SpeechSynthesisUtterance('Xin chào. Đây là thử giọng TTS.');
                    utterance.lang = 'vi-VN';
                    utterance.rate = settings.rate;
                    utterance.pitch = settings.pitch;
                    utterance.volume = settings.volume;
                    const voice = getTtsVoices('browser').find(v => v.voiceURI === settings.voiceURI);
                    if (voice) utterance.voice = voice;
                    window.speechSynthesis.speak(utterance);
                }
                showNotification('Đang phát thử giọng.');
                if (core && typeof core.getState === 'function') {
                    watchTtsCorePlaybackError(core, 'Không phát thử TTS được', getTtsErrorWatchDuration(settings));
                }
            } catch (err) {
                console.warn('[tm-translate] Không phát thử TTS được:', err);
                showNotification('Không phát thử TTS được.');
            }
        };

        if (libPrefetchRange && libPrefetchValue) {
            libPrefetchValue.textContent = `${libPrefetchRange.value}%`;
            libPrefetchRange.addEventListener('input', () => {
                libPrefetchValue.textContent = `${libPrefetchRange.value}%`;
            });
        }

        if (readerModeSelect) readerModeSelect.value = config.readerMode || 'single';
        if (showLibraryBtnCheckbox) showLibraryBtnCheckbox.checked = !!config.showLibraryButton;
        if (libBackupIntervalInput) libBackupIntervalInput.value = config.libraryBackupIntervalHours ?? DEFAULT_CONFIG.libraryBackupIntervalHours;
        if (readerFontSelect) readerFontSelect.value = config.readerStyle?.fontFamily || DEFAULT_CONFIG.readerStyle.fontFamily;
        if (readerFontSizeInput) readerFontSizeInput.value = config.readerStyle?.fontSize || DEFAULT_CONFIG.readerStyle.fontSize;
        if (readerLineHeightInput) readerLineHeightInput.value = config.readerStyle?.lineHeight || DEFAULT_CONFIG.readerStyle.lineHeight;
        if (readerParagraphSpacingInput) readerParagraphSpacingInput.value = config.readerStyle?.paragraphSpacing ?? DEFAULT_CONFIG.readerStyle.paragraphSpacing;
        if (readerIndentInput) readerIndentInput.value = config.readerStyle?.textIndent ?? DEFAULT_CONFIG.readerStyle.textIndent;
        if (readerBgInput) readerBgInput.value = config.readerStyle?.bgColor || DEFAULT_CONFIG.readerStyle.bgColor;
        if (readerTextColorInput) readerTextColorInput.value = config.readerStyle?.textColor || DEFAULT_CONFIG.readerStyle.textColor;
        if (readerPaddingInput) readerPaddingInput.value = config.readerStyle?.paddingX ?? DEFAULT_CONFIG.readerStyle.paddingX;
        if (readerAlignSelect) readerAlignSelect.value = config.readerStyle?.textAlign || DEFAULT_CONFIG.readerStyle.textAlign;

        if (readerResetBtn) {
            readerResetBtn.addEventListener('click', () => {
                if (readerModeSelect) readerModeSelect.value = DEFAULT_CONFIG.readerMode;
                if (showLibraryBtnCheckbox) showLibraryBtnCheckbox.checked = DEFAULT_CONFIG.showLibraryButton;
                if (libBackupIntervalInput) libBackupIntervalInput.value = DEFAULT_CONFIG.libraryBackupIntervalHours;
                if (readerFontSelect) readerFontSelect.value = DEFAULT_CONFIG.readerStyle.fontFamily;
                if (readerFontSizeInput) readerFontSizeInput.value = DEFAULT_CONFIG.readerStyle.fontSize;
                if (readerLineHeightInput) readerLineHeightInput.value = DEFAULT_CONFIG.readerStyle.lineHeight;
                if (readerParagraphSpacingInput) readerParagraphSpacingInput.value = DEFAULT_CONFIG.readerStyle.paragraphSpacing;
                if (readerIndentInput) readerIndentInput.value = DEFAULT_CONFIG.readerStyle.textIndent;
                if (readerBgInput) readerBgInput.value = DEFAULT_CONFIG.readerStyle.bgColor;
                if (readerTextColorInput) readerTextColorInput.value = DEFAULT_CONFIG.readerStyle.textColor;
                if (readerPaddingInput) readerPaddingInput.value = DEFAULT_CONFIG.readerStyle.paddingX;
                if (readerAlignSelect) readerAlignSelect.value = DEFAULT_CONFIG.readerStyle.textAlign;
                if (libPrefetchRange && libPrefetchValue) {
                    libPrefetchRange.value = DEFAULT_CONFIG.readerPrefetchPercent;
                    libPrefetchValue.textContent = `${DEFAULT_CONFIG.readerPrefetchPercent}%`;
                }
            });
        }

        applyTtsSettingsToUI(ttsSettings);
        [ttsRateInput, ttsPitchInput, ttsVolumeInput].forEach(input => {
            input?.addEventListener('input', updateTtsRangeLabels);
        });
        ttsProviderSelect?.addEventListener('change', () => {
            const provider = ttsProviderSelect.value || TTS_DEFAULT_SETTINGS.provider;
            const current = readTtsSettingsFromUI();
            const voiceKey = getTtsProviderVoiceKey(provider);
            ttsWorkingSettings = normalizeTtsSettings({
                ...ttsWorkingSettings,
                ...current,
                provider,
                [voiceKey]: ttsWorkingSettings[voiceKey]
            });
            populateTtsVoices(ttsWorkingSettings.provider, getTtsVoiceValue(ttsWorkingSettings, ttsWorkingSettings.provider));
            updateTtsProviderUi(ttsWorkingSettings);
        });
        ttsVoiceSelect?.addEventListener('change', () => {
            ttsWorkingSettings = readTtsSettingsFromUI();
        });
        ttsSleepEnabledInput?.addEventListener('change', () => {
            if (ttsSleepTimerInput) ttsSleepTimerInput.disabled = !ttsSleepEnabledInput.checked;
            ttsWorkingSettings = readTtsSettingsFromUI();
        });
        ttsRefreshVoicesBtn?.addEventListener('click', () => {
            const current = readTtsSettingsFromUI();
            populateTtsVoices(current.provider, getTtsVoiceValue(current, current.provider));
        });
        ttsTikTokCookieBtn?.addEventListener('click', () => openTtsSecretModal('tiktok'));
        ttsZaloApiBtn?.addEventListener('click', () => openTtsSecretModal('zalo'));
        ttsTikTokCookieClearBtn?.addEventListener('click', () => {
            ttsWorkingSettings = normalizeTtsSettings({ ...ttsWorkingSettings, tiktokCookieText: '' });
            saveTtsSettings({ ...loadTtsSettings(), tiktokCookieText: '' });
            updateTtsProviderUi(ttsWorkingSettings);
            showNotification('Đã xóa cookie TikTok.');
        });
        ttsZaloApiClearBtn?.addEventListener('click', () => {
            ttsWorkingSettings = normalizeTtsSettings({ ...ttsWorkingSettings, zaloApiKeysText: '' });
            saveTtsSettings({ ...loadTtsSettings(), zaloApiKeysText: '' });
            updateTtsProviderUi(ttsWorkingSettings);
            showNotification('Đã xóa API key Zalo.');
        });
        ttsOpenTikTokBtn?.addEventListener('click', () => window.open('https://www.tiktok.com/', '_blank', 'noopener,noreferrer'));
        ttsSecretSaveBtn?.addEventListener('click', saveTtsSecretModal);
        ttsSecretCancelBtn?.addEventListener('click', closeTtsSecretModal);
        ttsSecretCloseBtn?.addEventListener('click', closeTtsSecretModal);
        ttsSecretModal?.querySelector('.tm-modal-backdrop')?.addEventListener('click', closeTtsSecretModal);
        ttsSecretText?.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') closeTtsSecretModal();
        });
        ttsResetBtn?.addEventListener('click', () => {
            applyTtsSettingsToUI(TTS_DEFAULT_SETTINGS);
        });
        ttsStopBtn?.addEventListener('click', () => {
            stopTtsPlayback();
            showNotification('Đã dừng phát TTS.');
        });
        ttsClearCacheBtn?.addEventListener('click', () => {
            const core = getTtsCore();
            if (core && typeof core.clearRemoteAudioCache === 'function') {
                try { core.clearRemoteAudioCache(); } catch (err) { /* ignore */ }
            }
            showNotification('Đã xóa cache audio TTS.');
        });
        ttsTestBtn?.addEventListener('click', playTtsPreview);

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

        tmUIRoot.appendChild(wrapper);

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
            if (!tab.dataset.tab) return;
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
        wrapper.querySelector('#tm-show-help-btn').checked = config.showHelpButton !== false;
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
            tempConfigCheck.readerPrefetchPercent = parseInt(wrapper.querySelector('#tm-lib-prefetch')?.value, 10) || 50;
            tempConfigCheck.showLibraryButton = !!wrapper.querySelector('#tm-show-library-btn')?.checked;
            tempConfigCheck.libraryBackupIntervalHours = readNumberInput('#tm-lib-backup-interval', DEFAULT_CONFIG.libraryBackupIntervalHours, 0.25, 168);
            tempConfigCheck.readerMode = wrapper.querySelector('#tm-reader-mode')?.value || 'single';
            const readerFullscreenEl = wrapper.querySelector('#tm-reader-fullscreen');
            if (readerFullscreenEl) tempConfigCheck.readerFullscreen = !!readerFullscreenEl.checked;
            tempConfigCheck.readerStyle = readReaderStyleFromUI();

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
            tempConfigCheck.retryCount = Math.max(0, parseInt(wrapper.querySelector('#tm-retry')?.value, 10) || 0);
            tempConfigCheck.activeNameSet = setSelect.value;

            tempConfigCheck.nameSets = config.nameSets;
            tempConfigCheck.blacklist = tempBlacklist;

            const newConfigSnapshot = JSON.stringify(tempConfigCheck);
            const newTtsSettingsSnapshot = JSON.stringify(readTtsSettingsFromUI());

            if (newConfigSnapshot !== configSnapshot || newTtsSettingsSnapshot !== ttsSettingsSnapshot) {
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
        wrapper.querySelector('#tm-settings-guide-btn')?.addEventListener('click', () => {
            close();
            setTimeout(openHelpModalFull, 100);
        });

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
            config.showHelpButton = wrapper.querySelector('#tm-show-help-btn').checked;
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
            config.readerPrefetchPercent = parseInt(wrapper.querySelector('#tm-lib-prefetch')?.value, 10) || 50;
            config.showLibraryButton = !!wrapper.querySelector('#tm-show-library-btn')?.checked;
            config.libraryBackupIntervalHours = readNumberInput('#tm-lib-backup-interval', DEFAULT_CONFIG.libraryBackupIntervalHours, 0.25, 168);
            config.readerMode = wrapper.querySelector('#tm-reader-mode')?.value || 'single';
            const saveReaderFullscreenEl = wrapper.querySelector('#tm-reader-fullscreen');
            if (saveReaderFullscreenEl) config.readerFullscreen = !!saveReaderFullscreenEl.checked;
            config.readerStyle = readReaderStyleFromUI();
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
            config.retryCount = Math.max(0, parseInt(wrapper.querySelector('#tm-retry')?.value, 10) || 0);

            config.blacklist = tempBlacklist;

            config.activeNameSet = setSelect.value;
            saveTtsSettings(readTtsSettingsFromUI());
            saveConfig(config);
            libScheduleAutoBackup({ status: libGetBackupStatus() }).catch(err => {
                console.warn('[tm-translate] Không cập nhật lịch auto backup sau khi lưu cài đặt:', err);
            });

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

            if (libReaderUI && libReaderState) {
                libReaderApplySettings();
                libReaderLoadCurrentChapter();
            }

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

        tmUIRoot.appendChild(container);
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
                tmUIRoot.appendChild(floatBtn);
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


        tmUIRoot.appendChild(modal);

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
                        let floatBtn = tmEl('tm-ocr-float-edit');
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
                        tmUIRoot.appendChild(floatBtn);
                        setTimeout(() => { if (floatBtn) floatBtn.remove(); }, 3000);
                    });
                }
            });
            outputBox.addEventListener('mousedown', () => {
                const b = tmEl('tm-ocr-float-edit');
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
        if (tmEl(modalId)) return;

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

        tmUIRoot.appendChild(modal);
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
        let container = tmEl(containerId);
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
        tmUIRoot.appendChild(container);

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
        if (tmEl(modalId)) tmEl(modalId).remove();

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

        tmUIRoot.appendChild(modal);

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

    /* ================== LIBRARY STORAGE (NEW - GM-based, cross-domain) ================== */
    const LIB_DB_NAME = 'tm_translate_library_v1'; // kept for legacy migration
    const LIB_DB_VERSION = 1;
    const LIB_INDEX_KEY = 'tm_lib_index_v1';
    const LIB_CHAPTERS_PREFIX = 'tm_lib_chapters_';
    const LIB_CONTENT_PREFIX = 'tm_lib_c_';
    const LIB_EXPORT_HTML_RECOMMEND_MAX_CHAPTERS = 180;
    const LIB_EXPORT_HTML_RECOMMEND_MAX_BYTES = 2 * 1024 * 1024;
    const LIB_EXPORT_HTML_WARN_CHAPTERS = 260;
    const LIB_EXPORT_HTML_WARN_BYTES = 4 * 1024 * 1024;
    const LIB_LIST_PAGE_SIZE = 24;
    const LIB_BACKUP_FILE_FORMAT = 'tm-translate-library-backup';
    const LIB_BACKUP_FILE_VERSION = 2;
    const LIB_BACKUP_STATUS_KEY = 'tm_lib_backup_status_v1';
    const LIB_BACKUP_MIN_INTERVAL_HOURS = 0.25;
    const LIB_BACKUP_MAX_INTERVAL_HOURS = 168;
    const libTitleCache = new Map();
    let libBackupTask = null;
    let libBackupScheduleTimer = 0;
    let libBackupScheduleStatusEl = null;

    // NEW: small hash helper for IDs
    function libHashString(str) {
        let h1 = 0xdeadbeef ^ str.length, h2 = 0x41c6ce57 ^ str.length;
        for (let i = 0; i < str.length; i++) {
            const ch = str.charCodeAt(i);
            h1 = Math.imul(h1 ^ ch, 2654435761);
            h2 = Math.imul(h2 ^ ch, 1597334677);
        }
        h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
        h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
        return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
    }

    function libMakeBookId(title, author, createdAt) {
        return 'bk_' + libHashString(`${title}|${author || ''}|${createdAt}`);
    }
    function libMakeChapterId(bookId, order, title) {
        return 'ch_' + libHashString(`${bookId}|${order}|${title}`);
    }
    function libMakeRawKey(chapterId, text) {
        return 'raw_' + libHashString(`${chapterId}|${text}`);
    }
    function libMakeTransKey(chapterId, rawKey) {
        const version = config.nameSetVersion || 1;
        return 'tr_' + libHashString(`${chapterId}|${rawKey}|${version}`);
    }

    /* --- GM-based storage helpers (cross-domain) --- */

    function libSaveChaptersForBook(bookId, chapters) {
        GM_setValue(LIB_CHAPTERS_PREFIX + bookId, chapters);
    }

    function libLoadChaptersForBook(bookId) {
        return GM_getValue(LIB_CHAPTERS_PREFIX + bookId, []);
    }

    function libSaveContent(key, data) {
        GM_setValue(LIB_CONTENT_PREFIX + key, data);
    }

    function libLoadContent(key) {
        return GM_getValue(LIB_CONTENT_PREFIX + key, null);
    }

    function libDeleteContent(key) {
        GM_deleteValue(LIB_CONTENT_PREFIX + key);
    }

    function libDeleteChaptersForBook(bookId) {
        GM_deleteValue(LIB_CHAPTERS_PREFIX + bookId);
    }

    // Compatibility wrappers (used by callers that previously used libPutMany/libGet)
    async function libPutMany(storeName, items) {
        if (!items || items.length === 0) return;
        if (storeName === 'tm_chapters') {
            // Group chapters by bookId and merge into existing arrays
            const byBook = {};
            items.forEach(item => {
                const bid = item.bookId;
                if (!byBook[bid]) byBook[bid] = libLoadChaptersForBook(bid);
                const existing = byBook[bid];
                const idx = existing.findIndex(c => c.chapterId === item.chapterId);
                if (idx >= 0) existing[idx] = item;
                else existing.push(item);
                byBook[bid] = existing;
            });
            Object.entries(byBook).forEach(([bid, chapters]) => libSaveChaptersForBook(bid, chapters));
        } else if (storeName === 'tm_content') {
            items.forEach(item => libSaveContent(item.key, item));
        }
    }

    async function libGet(storeName, key) {
        if (storeName === 'tm_chapters') {
            // Need to find chapter by chapterId across all books
            const index = libLoadIndex();
            for (const book of (index.books || [])) {
                const chapters = libLoadChaptersForBook(book.bookId);
                const found = chapters.find(c => c.chapterId === key);
                if (found) return found;
            }
            return null;
        } else if (storeName === 'tm_content') {
            let data = libLoadContent(key);
            if (data) return data;

            // Fallback: try reading from legacy IndexedDB
            try {
                const db = await libOpenDbLegacy();
                data = await new Promise((resolve, reject) => {
                    const tx = db.transaction('tm_content', 'readonly');
                    const req = tx.objectStore('tm_content').get(key);
                    req.onsuccess = () => resolve(req.result || null);
                    req.onerror = () => reject(req.error);
                });
                if (data) {
                    // Save to GM for future cross-domain access
                    libSaveContent(key, data);
                    return data;
                }
            } catch (e) {
                // Legacy DB not available, ignore
            }
            return null;
        }
        return null;
    }

    async function libClearTranslatedContent() {
        const now = Date.now();
        const index = libLoadIndex();

        // Clear transKey from all chapters and delete translated content
        for (const book of (index.books || [])) {
            const chapters = libLoadChaptersForBook(book.bookId);
            let changed = false;
            chapters.forEach(ch => {
                if (ch.transKey) {
                    libDeleteContent(ch.transKey);
                    ch.transKey = null;
                    ch.updatedAt = now;
                    changed = true;
                }
            });
            if (changed) libSaveChaptersForBook(book.bookId, chapters);
        }
        libSetBackupStatus({ state: 'dirty', message: 'Cache dịch đã thay đổi, chưa sao lưu.' });
    }

    async function libGetTranslatedCacheSizeBytes() {
        const encoder = new TextEncoder();
        let total = 0;
        const allKeys = GM_listValues();
        for (const gmKey of allKeys) {
            if (gmKey.startsWith(LIB_CONTENT_PREFIX + 'tr_')) {
                const data = GM_getValue(gmKey, null);
                if (data?.text) {
                    total += encoder.encode(data.text).length;
                }
            }
        }
        return total;
    }

    /* --- Legacy IndexedDB (only for migration) --- */
    let libDbPromise = null;

    function libOpenDbLegacy() {
        if (libDbPromise) return libDbPromise;
        libDbPromise = new Promise((resolve, reject) => {
            try {
                const req = indexedDB.open(LIB_DB_NAME, LIB_DB_VERSION);
                req.onupgradeneeded = () => {
                    const db = req.result;
                    if (!db.objectStoreNames.contains('tm_chapters')) {
                        db.createObjectStore('tm_chapters', { keyPath: 'chapterId' });
                    }
                    if (!db.objectStoreNames.contains('tm_content')) {
                        db.createObjectStore('tm_content', { keyPath: 'key' });
                    }
                };
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
            } catch (e) {
                reject(e);
            }
        });
        return libDbPromise;
    }

    async function libCheckLegacyDataExists() {
        try {
            const db = await libOpenDbLegacy();
            return new Promise((resolve) => {
                const tx = db.transaction('tm_chapters', 'readonly');
                const store = tx.objectStore('tm_chapters');
                const req = store.openCursor();
                let found = false;
                req.onsuccess = () => {
                    if (req.result && !found) {
                        found = true;
                    }
                    if (req.result) req.result.continue();
                };
                tx.oncomplete = () => resolve(found);
                tx.onerror = () => resolve(false);
            });
        } catch (e) {
            return false;
        }
    }

    async function libMigrateLegacyData() {
        try {
            const db = await libOpenDbLegacy();

            // 1. Read all chapters from legacy IndexedDB
            const allChapters = await new Promise((resolve, reject) => {
                const tx = db.transaction('tm_chapters', 'readonly');
                const store = tx.objectStore('tm_chapters');
                const result = [];
                const req = store.openCursor();
                req.onsuccess = () => {
                    const cursor = req.result;
                    if (cursor) {
                        result.push(cursor.value);
                        cursor.continue();
                    }
                };
                tx.oncomplete = () => resolve(result);
                tx.onerror = () => reject(tx.error);
            });

            // 2. Read all content from legacy IndexedDB
            const allContent = await new Promise((resolve, reject) => {
                const tx = db.transaction('tm_content', 'readonly');
                const store = tx.objectStore('tm_content');
                const result = [];
                const req = store.openCursor();
                req.onsuccess = () => {
                    const cursor = req.result;
                    if (cursor) {
                        result.push(cursor.value);
                        cursor.continue();
                    }
                };
                tx.oncomplete = () => resolve(result);
                tx.onerror = () => reject(tx.error);
            });

            if (allChapters.length === 0 && allContent.length === 0) {
                return { chapters: 0, content: 0 };
            }

            // 3. Group chapters by bookId and save to GM
            const byBook = {};
            allChapters.forEach(ch => {
                if (!byBook[ch.bookId]) byBook[ch.bookId] = [];
                byBook[ch.bookId].push(ch);
            });
            Object.entries(byBook).forEach(([bookId, chapters]) => {
                const existing = libLoadChaptersForBook(bookId);
                // Merge: add new chapters, update existing
                chapters.forEach(ch => {
                    const idx = existing.findIndex(e => e.chapterId === ch.chapterId);
                    if (idx >= 0) existing[idx] = ch;
                    else existing.push(ch);
                });
                libSaveChaptersForBook(bookId, existing);
            });

            // 4. Save all content to GM
            allContent.forEach(item => {
                if (!libLoadContent(item.key)) {
                    libSaveContent(item.key, item);
                }
            });

            // 5. Clear legacy IndexedDB
            await new Promise((resolve, reject) => {
                const tx = db.transaction(['tm_chapters', 'tm_content'], 'readwrite');
                tx.objectStore('tm_chapters').clear();
                tx.objectStore('tm_content').clear();
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            });

            return { chapters: allChapters.length, content: allContent.length };
        } catch (e) {
            console.error('[TM-Translate] Migration failed:', e);
            throw e;
        }
    }


    function libFormatBytes(bytes) {
        if (!bytes || bytes <= 0) return '0 B';
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unit = 0;
        while (size >= 1024 && unit < units.length - 1) {
            size /= 1024;
            unit++;
        }
        return `${size.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
    }

    function libEstimateExportBytes(book) {
        const stored = Number(book?.contentBytes || book?.rawBytes || 0);
        if (Number.isFinite(stored) && stored > 0) {
            return { bytes: stored, estimated: false };
        }
        const chapterCount = Math.max(0, Number(book?.chapterCount || 0));
        if (!chapterCount) return { bytes: 0, estimated: true };
        return { bytes: chapterCount * 12000, estimated: true };
    }

    function libGetExportRecommendation(book) {
        const chapterCount = Math.max(0, Number(book?.chapterCount || 0));
        const sizeInfo = libEstimateExportBytes(book);
        const tooLargeForHtml = chapterCount > LIB_EXPORT_HTML_RECOMMEND_MAX_CHAPTERS
            || sizeInfo.bytes > LIB_EXPORT_HTML_RECOMMEND_MAX_BYTES;
        const stronglyWarnHtml = chapterCount > LIB_EXPORT_HTML_WARN_CHAPTERS
            || sizeInfo.bytes > LIB_EXPORT_HTML_WARN_BYTES;
        const sizeText = sizeInfo.bytes > 0
            ? `${sizeInfo.estimated ? '~' : ''}${libFormatBytes(sizeInfo.bytes)}`
            : 'chưa rõ dung lượng';
        const detail = `${chapterCount || 0} chương, ${sizeText}`;
        return {
            recommended: tooLargeForHtml ? 'epub' : 'html',
            stronglyWarnHtml,
            detail,
            htmlTitle: tooLargeForHtml
                ? `HTML nhúng toàn bộ data (${detail}) nên có thể lag khi mở/xem. Nên xuất EPUB.`
                : `HTML phù hợp để đọc offline với truyện nhỏ/vừa (${detail}).`,
            epubTitle: tooLargeForHtml
                ? `Đề xuất cho truyện lớn (${detail}); nhẹ hơn khi đọc so với HTML nhúng toàn bộ data.`
                : `EPUB vẫn phù hợp nếu muốn đọc bằng app/thiết bị đọc sách (${detail}).`
        };
    }

    function libRenderExportButton(label, type, book) {
        const rec = libGetExportRecommendation(book);
        const isRecommended = rec.recommended === type;
        const className = `tm-btn tm-lib-export-${type}${isRecommended ? ' tm-lib-export-recommended' : ''}`;
        const title = type === 'html' ? rec.htmlTitle : rec.epubTitle;
        return `<button class="${className}" data-book-id="${escapeHtml(book.bookId)}" title="${escapeHtml(title)}">${label}${isRecommended ? '<span class="tm-lib-export-badge">đề xuất</span>' : ''}</button>`;
    }

    async function libUpdateLibraryProgress(wrapper, books) {
        if (!wrapper || !Array.isArray(books)) return;
        const index = libLoadIndex();
        let updated = false;

        for (const book of books) {
            const el = wrapper.querySelector(`#tm-lib-progress-${book.bookId}`);
            if (!el) continue;
            const total = book.chapterCount || 0;
            if (!total || !book.lastReadChapterId) {
                el.textContent = 'Tiến độ: Chưa đọc';
                continue;
            }
            let order = book.lastReadOrder;
            if (!order) {
                const ch = await libGet('tm_chapters', book.lastReadChapterId);
                if (ch?.order) {
                    order = ch.order;
                    const idxBook = (index.books || []).find(b => b.bookId === book.bookId);
                    if (idxBook) {
                        idxBook.lastReadOrder = order;
                        updated = true;
                    }
                }
            }
            if (!order) {
                el.textContent = 'Tiến độ: Đang đọc...';
                continue;
            }
            const ratio = typeof book.lastReadScrollRatio === 'number' ? book.lastReadScrollRatio : 0;
            const percent = Math.max(0, Math.min(100, (((order - 1) + ratio) / Math.max(1, total)) * 100));
            el.textContent = `Tiến độ: Chương ${order}/${total} (${percent.toFixed(1)}%)`;
        }

        if (updated) {
            libSaveIndex(index);
        }
    }

    function libLoadIndex() {
        const fallback = { books: [], nameSetVersion: config.nameSetVersion || 1, configVersion: 1 };
        const index = GM_getValue(LIB_INDEX_KEY);
        if (!index || !index.books) return fallback;
        return { ...fallback, ...index };
    }

    function libSaveIndex(index) {
        GM_setValue(LIB_INDEX_KEY, index);
    }

    function libFormatRelativeTime(timestamp) {
        const t = Number(timestamp) || 0;
        if (!t) return 'Chưa sao lưu';
        const diff = Math.max(0, Date.now() - t);
        const minute = 60 * 1000;
        const hour = 60 * minute;
        const day = 24 * hour;
        if (diff < minute) return 'Vừa sao lưu';
        if (diff < hour) return `Đã sao lưu ${Math.floor(diff / minute)} phút trước`;
        if (diff < day) return `Đã sao lưu ${Math.floor(diff / hour)} tiếng trước`;
        return `Đã sao lưu ${Math.floor(diff / day)} ngày trước`;
    }

    function libClampBackupIntervalHours(value) {
        const n = Number(value);
        if (!Number.isFinite(n)) return DEFAULT_CONFIG.libraryBackupIntervalHours;
        return Math.min(LIB_BACKUP_MAX_INTERVAL_HOURS, Math.max(LIB_BACKUP_MIN_INTERVAL_HOURS, n));
    }

    function libGetBackupIntervalHours() {
        const cfg = loadConfig();
        return libClampBackupIntervalHours(cfg.libraryBackupIntervalHours);
    }

    function libGetBackupIntervalMs() {
        return libGetBackupIntervalHours() * 60 * 60 * 1000;
    }

    function libFormatDuration(ms) {
        const totalMinutes = Math.max(1, Math.ceil((Number(ms) || 0) / 60000));
        if (totalMinutes < 60) return `${totalMinutes} phút`;
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        if (hours < 24) return minutes ? `${hours} giờ ${minutes} phút` : `${hours} giờ`;
        const days = Math.floor(hours / 24);
        const restHours = hours % 24;
        return restHours ? `${days} ngày ${restHours} giờ` : `${days} ngày`;
    }

    function libGetNextAutoBackupAt(status = libGetBackupStatus()) {
        if (!status || status.state !== 'dirty') return 0;
        const dirtyAt = Number(status.dirtyAt || status.updatedAt || 0) || Date.now();
        const lastCompletedAt = Number(status.lastCompletedAt || 0) || 0;
        if (!lastCompletedAt) return dirtyAt;
        return Math.max(dirtyAt, lastCompletedAt + libGetBackupIntervalMs());
    }

    function libDescribeBackupStatus(status = libGetBackupStatus()) {
        const fileText = status.fileName || '';
        if (status.state === 'running') return status.message || 'Đang sao lưu...';
        if (status.state === 'error') return status.message || 'Sao lưu lỗi.';
        if (status.state === 'dirty') {
            const base = status.message || 'Thư viện có thay đổi chưa sao lưu.';
            return `${base} Bấm Sao lưu để tải file backup.`;
        }
        if (status.lastCompletedAt) {
            return `${libFormatRelativeTime(status.lastCompletedAt)}${fileText ? ` · ${fileText}` : ''}`;
        }
        return 'Chưa sao lưu';
    }

    function libDescribeBackupNoFile(status = libGetBackupStatus()) {
        if (status.state === 'dirty') {
            return `${status.message || 'Thư viện có thay đổi chưa sao lưu.'} Bấm Sao lưu để tải file backup.`;
        }
        if (status.lastCompletedAt) {
            return `${libFormatRelativeTime(status.lastCompletedAt)}. Bấm Sao lưu để tải file mới nếu cần.`;
        }
        return 'Chưa sao lưu';
    }

    function libDescribeBackupStatusShort(status = libGetBackupStatus()) {
        if (!status || !status.state) {
            return status?.lastCompletedAt ? libFormatRelativeTime(status.lastCompletedAt) : 'Chưa sao lưu';
        }
        if (status.state === 'running') {
            const progress = Number(status.progress);
            return Number.isFinite(progress) ? `Sao lưu ${Math.max(0, Math.min(100, progress))}%` : 'Đang sao lưu';
        }
        if (status.state === 'error') return 'Sao lưu lỗi';
        if (status.state === 'dirty') return 'Chưa sao lưu';
        if (status.lastCompletedAt) return libFormatRelativeTime(status.lastCompletedAt);
        return 'Chưa sao lưu';
    }

    function libSetBackupStatusDisplay(el, shortText, fullText) {
        if (!el) return;
        const shortValue = String(shortText || 'Chưa sao lưu');
        const fullValue = String(fullText || shortValue);
        el.textContent = shortValue;
        el.title = fullValue;
    }

    function libGetBackupStatus() {
        const status = GM_getValue(LIB_BACKUP_STATUS_KEY, null);
        return status && typeof status === 'object' ? status : {};
    }

    function libSetBackupStatus(patch) {
        const normalizedPatch = patch && typeof patch === 'object' ? { ...patch } : {};
        const becameDirty = normalizedPatch.state === 'dirty';
        if (becameDirty && !normalizedPatch.dirtyAt) {
            normalizedPatch.dirtyAt = Date.now();
        }
        const next = {
            ...libGetBackupStatus(),
            ...normalizedPatch,
            updatedAt: Date.now()
        };
        GM_setValue(LIB_BACKUP_STATUS_KEY, next);
        return next;
    }

    function libSortBooksForLibrary(books) {
        return [...(books || [])].sort((a, b) => {
            const aRead = Number(a?.lastReadAt || (a?.lastReadChapterId ? a?.updatedAt : 0)) || 0;
            const bRead = Number(b?.lastReadAt || (b?.lastReadChapterId ? b?.updatedAt : 0)) || 0;
            if (aRead !== bRead) return bRead - aRead;
            return (Number(b?.createdAt || b?.updatedAt || 0) || 0) - (Number(a?.createdAt || a?.updatedAt || 0) || 0);
        });
    }

    function libDefaultCoverDataUrl(book) {
        const title = String(book?.title || 'TM Translate').trim() || 'TM Translate';
        const author = String(book?.author || '').trim();
        const seed = libHashString(`${book?.bookId || ''}|${title}`);
        const palettes = [
            ['#0f766e', '#f8fafc', '#f59e0b'],
            ['#1d4ed8', '#f8fafc', '#22c55e'],
            ['#be123c', '#fff7ed', '#0f172a'],
            ['#334155', '#fef3c7', '#2563eb'],
            ['#166534', '#ecfeff', '#ea580c']
        ];
        const palette = palettes[parseInt(seed.slice(-1), 36) % palettes.length] || palettes[0];
        const shortTitle = title.length > 18 ? `${title.slice(0, 18)}...` : title;
        const shortAuthor = author ? (author.length > 18 ? `${author.slice(0, 18)}...` : author) : 'TM Translate';
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="260" viewBox="0 0 180 260">
<defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="${palette[0]}"/><stop offset="1" stop-color="${palette[2]}"/></linearGradient></defs>
<rect width="180" height="260" rx="14" fill="url(#g)"/>
<rect x="16" y="18" width="148" height="224" rx="10" fill="${palette[1]}" opacity=".92"/>
<path d="M45 58h90M45 78h74M45 174h90M45 192h62" stroke="${palette[0]}" stroke-width="5" stroke-linecap="round" opacity=".35"/>
<text x="90" y="122" text-anchor="middle" font-family="Arial, sans-serif" font-size="17" font-weight="700" fill="#111827">${escapeHtml(shortTitle)}</text>
<text x="90" y="146" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#475569">${escapeHtml(shortAuthor)}</text>
</svg>`;
        return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    }

    function libGetBookCoverSrc(book) {
        return book?.coverDataUrl || book?.cover || libDefaultCoverDataUrl(book);
    }

    function libReadFileAsDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = () => reject(reader.error || new Error('Không đọc được file ảnh.'));
            reader.readAsDataURL(file);
        });
    }

    async function libSetBookCover(bookId, file) {
        if (!file || !/^image\//i.test(file.type || '')) {
            showNotification('Vui lòng chọn file ảnh.');
            return false;
        }
        if (file.size > 3 * 1024 * 1024) {
            showNotification('Ảnh bìa nên nhỏ hơn 3 MB.');
            return false;
        }
        const dataUrl = await libReadFileAsDataUrl(file);
        const index = libLoadIndex();
        const book = (index.books || []).find(b => b.bookId === bookId);
        if (!book) {
            showNotification('Không tìm thấy truyện.');
            return false;
        }
        book.coverDataUrl = dataUrl;
        book.updatedAt = Date.now();
        libSaveIndex(index);
        libSetBackupStatus({ state: 'dirty', message: 'Có thay đổi ảnh bìa chưa sao lưu.' });
        showNotification('Đã cập nhật ảnh bìa.');
        return true;
    }

    function libNormalizeSearchText(text) {
        return String(text || '').toLowerCase().normalize('NFKC');
    }

    async function libBookMatchesSearch(book, query, scopes) {
        const q = libNormalizeSearchText(query).trim();
        if (!q) return true;
        const activeScopes = scopes && scopes.size ? scopes : new Set(['title', 'author']);
        if (activeScopes.has('title') && libNormalizeSearchText(book?.title).includes(q)) return true;
        if (activeScopes.has('author') && libNormalizeSearchText(book?.author).includes(q)) return true;
        if (!activeScopes.has('raw') && !activeScopes.has('cache')) return false;

        const chapters = libLoadChaptersForBook(book.bookId);
        for (const chapter of chapters) {
            if (activeScopes.has('raw') && chapter.rawKey) {
                const raw = await libGet('tm_content', chapter.rawKey);
                if (libNormalizeSearchText(raw?.text).includes(q)) return true;
            }
            if (activeScopes.has('cache') && chapter.transKey) {
                const cached = await libGet('tm_content', chapter.transKey);
                if (libNormalizeSearchText(cached?.text).includes(q)) return true;
            }
        }
        return false;
    }

    async function libCollectBackupData() {
        const index = libLoadIndex();
        const books = libSortBooksForLibrary(index.books || []);
        const bookRecords = [];
        const contentKeys = new Set();
        for (const book of books) {
            const chapters = libLoadChaptersForBook(book.bookId);
            chapters.forEach(chapter => {
                if (chapter.rawKey) contentKeys.add(chapter.rawKey);
                if (chapter.transKey) contentKeys.add(chapter.transKey);
            });
            bookRecords.push({ book, chapters });
        }
        return { index: { ...index, books }, bookRecords, contentKeys: Array.from(contentKeys) };
    }

    function libClearAutoBackupTimer() {
        if (libBackupScheduleTimer) {
            clearTimeout(libBackupScheduleTimer);
            libBackupScheduleTimer = 0;
        }
    }

    async function libScheduleAutoBackup({ status = null, statusEl = null } = {}) {
        const currentStatus = status || libGetBackupStatus();
        if (statusEl) libBackupScheduleStatusEl = statusEl;
        const targetStatusEl = statusEl || libBackupScheduleStatusEl;
        libClearAutoBackupTimer();
        libSetBackupStatusDisplay(targetStatusEl, libDescribeBackupStatusShort(currentStatus), libDescribeBackupStatus(currentStatus));
        return null;
    }

    function libBackupTimestamp(date = new Date()) {
        const pad = n => String(n).padStart(2, '0');
        return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`;
    }

    function libBackupFileName() {
        return `tm-translate-library-backup-${libBackupTimestamp()}.tmbackup.jsonl`;
    }

    function libYieldToBrowser() {
        return new Promise(resolve => setTimeout(resolve, 0));
    }

    function libChooseBackupFile() {
        return new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.tmbackup.jsonl,.jsonl,.ndjson,application/json,text/plain';
            input.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0;';
            input.addEventListener('change', () => {
                const file = input.files && input.files[0] ? input.files[0] : null;
                input.remove();
                resolve(file);
            }, { once: true });
            input.addEventListener('cancel', () => {
                input.remove();
                resolve(null);
            }, { once: true });
            input.addEventListener('error', () => {
                input.remove();
                reject(input.error || new Error('Không chọn được file.'));
            }, { once: true });
            tmUIRoot.appendChild(input);
            input.click();
        });
    }

    function libValidateBackupManifest(record) {
        if (!record || record.type !== 'manifest' || record.format !== LIB_BACKUP_FILE_FORMAT) {
            throw new Error('File backup không hợp lệ.');
        }
        if (Number(record.version || 0) > LIB_BACKUP_FILE_VERSION) {
            throw new Error('File backup được tạo từ phiên bản mới hơn.');
        }
        return record;
    }

    async function libReadBackupManifestFromFile(file) {
        const head = await file.slice(0, Math.min(file.size, 1024 * 1024)).text();
        const line = head.split(/\r?\n/).find(item => item.trim());
        if (!line) throw new Error('File backup trống.');
        return libValidateBackupManifest(JSON.parse(line));
    }

    async function libForEachBackupRecord(file, onRecord, onProgress) {
        let loaded = 0;
        let count = 0;
        const parseLine = async (line) => {
            const text = String(line || '').trim();
            if (!text) return;
            count += 1;
            await onRecord(JSON.parse(text), count, loaded);
            if (count % 20 === 0) await libYieldToBrowser();
        };

        if (file.stream && typeof TextDecoder === 'function') {
            const reader = file.stream().getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer = '';
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                loaded += value.byteLength || 0;
                buffer += decoder.decode(value, { stream: true });
                let newlineIndex = buffer.search(/\r?\n/);
                while (newlineIndex >= 0) {
                    const line = buffer.slice(0, newlineIndex);
                    const advance = buffer[newlineIndex] === '\r' && buffer[newlineIndex + 1] === '\n' ? 2 : 1;
                    buffer = buffer.slice(newlineIndex + advance);
                    await parseLine(line);
                }
                if (onProgress) onProgress(loaded, count);
            }
            buffer += decoder.decode();
            if (buffer.trim()) await parseLine(buffer);
            if (onProgress) onProgress(file.size || loaded, count);
            return count;
        }

        const text = await file.text();
        loaded = file.size || text.length;
        const lines = text.split(/\r?\n/);
        for (const line of lines) {
            await parseLine(line);
            if (onProgress) onProgress(loaded, count);
        }
        return count;
    }

    async function libRunLibraryBackup({ silent = false, statusEl = null } = {}) {
        if (libBackupTask) return libBackupTask;
        libBackupTask = (async () => {
            libClearAutoBackupTimer();
            if (silent) return null;
            showNotification('Đang tạo file sao lưu. Đừng tắt tab giữa chừng.', 6000);
            const data = await libCollectBackupData();
            const total = Math.max(1, data.bookRecords.length + data.contentKeys.length + 2);
            const chunks = [];
            let done = 0;
            let contentCount = 0;
            const startedStatus = libSetBackupStatus({ state: 'running', progress: 0, message: 'Đang tạo file sao lưu 0%...' });
            libSetBackupStatusDisplay(statusEl, libDescribeBackupStatusShort(startedStatus), startedStatus.message);
            const appendRecord = async (record) => {
                chunks.push(JSON.stringify(record), '\n');
                done += 1;
                const progress = Math.min(99, Math.floor((done / total) * 100));
                const status = libSetBackupStatus({ state: 'running', progress, message: `Đang tạo file sao lưu ${progress}%...` });
                libSetBackupStatusDisplay(statusEl, libDescribeBackupStatusShort(status), status.message);
                if (done % 8 === 0) await libYieldToBrowser();
            };
            await appendRecord({
                type: 'manifest',
                format: LIB_BACKUP_FILE_FORMAT,
                version: 1,
                app: 'TM Translate',
                createdAt: Date.now(),
                index: { ...data.index, books: [] },
                bookCount: data.bookRecords.length,
                contentCount: data.contentKeys.length
            });

            for (const item of data.bookRecords) {
                await appendRecord({ type: 'book', book: item.book, chapters: item.chapters || [] });
            }
            for (const key of data.contentKeys) {
                const content = libLoadContent(key);
                if (content) {
                    contentCount += 1;
                    await appendRecord({ type: 'content', key, value: content });
                } else {
                    await appendRecord({ type: 'missingContent', key });
                }
            }
            await appendRecord({ type: 'end', bookCount: data.bookRecords.length, contentCount, completedAt: Date.now() });

            const filename = libBackupFileName();
            const blob = new Blob(chunks, { type: 'application/x-ndjson;charset=utf-8' });
            libDownloadBlob(blob, filename);
            const completed = libSetBackupStatus({
                state: 'done',
                progress: 100,
                fileName: filename,
                lastCompletedAt: Date.now(),
                dirtyAt: null,
                message: `Đã tạo file sao lưu: ${data.bookRecords.length} truyện, ${contentCount} nội dung, ${libFormatBytes(blob.size)}.`
            });
            libSetBackupStatusDisplay(
                statusEl,
                libDescribeBackupStatusShort(completed),
                `${completed.message} ${libFormatRelativeTime(completed.lastCompletedAt)}.`
            );
            showNotification('Đã tải file sao lưu thư viện.', 4500);
            return completed;
        })().finally(() => {
            libBackupTask = null;
        });
        return libBackupTask;
    }

    async function libMaybeRunBackgroundBackup(statusEl = null) {
        const status = libGetBackupStatus();
        if (statusEl) libBackupScheduleStatusEl = statusEl;
        libClearAutoBackupTimer();
        libSetBackupStatusDisplay(statusEl, libDescribeBackupStatusShort(status), libDescribeBackupNoFile(status));
    }

    async function libClearLibraryAll() {
        const allKeys = GM_listValues();
        allKeys.forEach(key => {
            if (key === LIB_INDEX_KEY || key.startsWith(LIB_CHAPTERS_PREFIX) || key.startsWith(LIB_CONTENT_PREFIX)) {
                GM_deleteValue(key);
            }
        });
        libSaveIndex({ books: [], nameSetVersion: config.nameSetVersion || 1, configVersion: 1 });
    }

    async function libRunLibraryRestore({ statusEl = null } = {}) {
        const file = await libChooseBackupFile();
        if (!file) return;
        const manifest = await libReadBackupManifestFromFile(file);
        const existing = libLoadIndex();
        let mode = 'replace';
        if ((existing.books || []).length > 0) {
            const answer = prompt('Thư viện hiện có dữ liệu. Nhập G để gộp, T để thay thế, bỏ trống để hủy.', 'G');
            if (!answer) return;
            mode = /^g/i.test(answer.trim()) ? 'merge' : (/^t/i.test(answer.trim()) ? 'replace' : '');
            if (!mode) return;
        }
        if (mode === 'replace') {
            const ok = confirm('Thay thế sẽ xóa toàn bộ thư viện hiện tại trước khi khôi phục. Tiếp tục?');
            if (!ok) return;
            await libClearLibraryAll();
        }

        const restoredBooks = [];
        let restoredContent = 0;
        libSetBackupStatusDisplay(statusEl, 'Khôi phục 0%', `Đang đọc ${file.name || 'file backup'}...`);
        await libForEachBackupRecord(file, async (record) => {
            if (!record || !record.type) return;
            if (record.type === 'manifest') {
                libValidateBackupManifest(record);
                return;
            }
            if (record.type === 'book' && record.book?.bookId) {
                restoredBooks.push(record.book);
                libSaveChaptersForBook(record.book.bookId, Array.isArray(record.chapters) ? record.chapters : []);
                return;
            }
            if (record.type === 'content') {
                const content = record.value || record.content;
                if (content?.key) {
                    libSaveContent(content.key, content);
                    restoredContent += 1;
                }
            }
        }, (loaded) => {
            const progress = file.size ? Math.min(100, Math.floor((loaded / file.size) * 100)) : 0;
            libSetBackupStatusDisplay(statusEl, `Khôi phục ${progress}%`, `Đang khôi phục ${progress}%...`);
        });

        const nextIndex = mode === 'merge' ? libLoadIndex() : { books: [], nameSetVersion: config.nameSetVersion || 1, configVersion: 1 };
        const map = new Map((nextIndex.books || []).map(book => [book.bookId, book]));
        restoredBooks.forEach(book => map.set(book.bookId, book));
        nextIndex.books = libSortBooksForLibrary(Array.from(map.values()));
        nextIndex.nameSetVersion = manifest.index?.nameSetVersion || config.nameSetVersion || 1;
        nextIndex.configVersion = 1;
        libSaveIndex(nextIndex);

        const restoredMessage = `Đã khôi phục ${restoredBooks.length} truyện, ${restoredContent} nội dung từ ${file.name || 'file backup'}. Thư viện mới chưa sao lưu lại.`;
        const status = libSetBackupStatus({ state: 'dirty', message: restoredMessage, restoredAt: Date.now() });
        libSetBackupStatusDisplay(statusEl, libDescribeBackupStatusShort(status), restoredMessage);
        showNotification(`Đã khôi phục ${restoredBooks.length} truyện.`);
    }

    async function libTranslateLibraryTitles(wrapper, books) {
        if (!wrapper || !books || books.length === 0) return;
        config = loadConfig();
        const zhBooks = books.filter(b => b && b.langSource === 'zh' && b.title);
        if (zhBooks.length === 0) return;

        const version = config.nameSetVersion || 1;
        const rawTitles = zhBooks.map(b => b.title);
        const cacheable = [];
        const toTranslate = [];
        zhBooks.forEach((b, i) => {
            const key = `book:${b.bookId || ''}:${version}:${b.title}`;
            if (libTitleCache.has(key)) {
                cacheable[i] = libTitleCache.get(key);
            } else {
                toTranslate.push({ idx: i, title: b.title, key });
            }
        });

        let translatedLines = [];
        if (toTranslate.length > 0) {
            try {
                const text = await translatePanelText(toTranslate.map(t => t.title).join('\n'), 'text');
                translatedLines = text.split(/\r?\n/);
                toTranslate.forEach((t, i) => {
                    const title = translatedLines[i] || t.title;
                    libTitleCache.set(t.key, title);
                });
            } catch (err) {
                console.error(err);
            }
        }

        const cssEscape = (window.CSS && CSS.escape) ? CSS.escape : (s) => String(s).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
        zhBooks.forEach((b, i) => {
            const key = `book:${b.bookId || ''}:${version}:${b.title}`;
            const translated = libTitleCache.get(key);
            if (!translated) return;
            const card = wrapper.querySelector(`.tm-card[data-book-id="${cssEscape(b.bookId)}"]`);
            const titleEl = card?.querySelector('.tm-lib-book-title');
            if (titleEl) titleEl.textContent = translated;
        });
    }

    // NEW: export helpers
    function libSafeFileName(name) {
        const cleaned = (name || 'book').replace(/[\\/:*?"<>|]+/g, '_').trim();
        return cleaned.slice(0, 120) || 'book';
    }

    function libDownloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    function libTextToHtml(text) {
        const escaped = escapeHtml(text || '');
        return escaped.split(/\n+/).map(line => {
            if (!line.trim()) return '<p><br/></p>';
            return `<p>${line}</p>`;
        }).join('\n');
    }

    function libClampExportNumber(value, fallback, min, max) {
        const n = Number(value);
        if (!Number.isFinite(n)) return fallback;
        return Math.max(min, Math.min(max, n));
    }

    function libSafeExportColor(value, fallback) {
        const color = String(value || '').trim();
        return /^#[0-9a-f]{6}$/i.test(color) ? color : fallback;
    }

    function libJsonForHtml(value) {
        return JSON.stringify(value)
            .replace(/</g, '\\u003c')
            .replace(/>/g, '\\u003e')
            .replace(/&/g, '\\u0026')
            .replace(/\u2028/g, '\\u2028')
            .replace(/\u2029/g, '\\u2029');
    }

    function libBuildReaderExportHtml(book, exportBookTitle, exportChapters, style) {
        const baseStyle = style || DEFAULT_CONFIG.readerStyle;
        const htmlDefaultPaddingX = 30;
        const title = exportBookTitle || book?.title || 'Untitled';
        const safeTitle = escapeHtml(title);
        const exportStyle = {
            fontFamily: baseStyle.fontFamily || DEFAULT_CONFIG.readerStyle.fontFamily,
            fontSize: libClampExportNumber(baseStyle.fontSize, DEFAULT_CONFIG.readerStyle.fontSize, 12, 40),
            lineHeight: libClampExportNumber(baseStyle.lineHeight, DEFAULT_CONFIG.readerStyle.lineHeight, 1.2, 3),
            paragraphSpacing: libClampExportNumber(baseStyle.paragraphSpacing, DEFAULT_CONFIG.readerStyle.paragraphSpacing, 0, 80),
            textIndent: libClampExportNumber(baseStyle.textIndent, DEFAULT_CONFIG.readerStyle.textIndent, 0, 8),
            bgColor: libSafeExportColor(baseStyle.bgColor, DEFAULT_CONFIG.readerStyle.bgColor),
            textColor: libSafeExportColor(baseStyle.textColor, DEFAULT_CONFIG.readerStyle.textColor),
            paddingX: libClampExportNumber(
                baseStyle.paddingX === DEFAULT_CONFIG.readerStyle.paddingX ? htmlDefaultPaddingX : baseStyle.paddingX,
                htmlDefaultPaddingX,
                0,
                240
            ),
            textAlign: ['left', 'right', 'justify', 'center'].includes(baseStyle.textAlign) ? baseStyle.textAlign : DEFAULT_CONFIG.readerStyle.textAlign
        };
        const storageKey = `tm-export-reader:${libHashString(`${book?.bookId || ''}|${title}|${exportChapters.length}`)}`;
        const payload = libJsonForHtml({
            title,
            author: book?.author || '',
            bookId: book?.bookId || storageKey,
            storageKey,
            exportedAt: new Date().toISOString(),
            style: exportStyle,
            chapters: exportChapters.map((ch, idx) => ({
                title: ch.title || `Chương ${idx + 1}`,
                text: libNormalizeChapterParagraphBreaks(ch.text || '')
            }))
        });

        return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${safeTitle}</title>
<style>
:root {
  --bg: ${exportStyle.bgColor};
  --text: ${exportStyle.textColor};
  --surface: color-mix(in srgb, var(--bg) 88%, white 12%);
  --surface-soft: color-mix(in srgb, var(--bg) 78%, transparent);
  --border: color-mix(in srgb, var(--text) 18%, transparent);
  --muted: color-mix(in srgb, var(--text) 56%, transparent);
  --accent: #0f7cff;
  --font-family: ${exportStyle.fontFamily};
  --font-size: ${exportStyle.fontSize}px;
  --line-height: ${exportStyle.lineHeight};
  --paragraph-spacing: ${exportStyle.paragraphSpacing}px;
  --text-indent: ${exportStyle.textIndent}em;
  --side-padding: ${exportStyle.paddingX}px;
  --text-align: ${exportStyle.textAlign};
  color-scheme: light dark;
}
* { box-sizing: border-box; }
html, body { margin: 0; min-height: 100%; }
body {
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-family);
  overflow: hidden;
}
button, input, select { font: inherit; color: inherit; }
button { cursor: pointer; }
.tmx-shell { height: 100vh; height: 100dvh; display: flex; flex-direction: column; min-height: 0; }
.tmx-header, .tmx-footer {
  flex: 0 0 auto; margin: 8px; padding: 8px 12px;
  border: 1px solid var(--border); border-radius: 16px;
  background: color-mix(in srgb, var(--surface) 82%, transparent);
  backdrop-filter: blur(10px); box-shadow: 0 10px 24px rgba(0,0,0,.10);
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
}
.tmx-title { min-width: 0; }
.tmx-title h1 { margin: 0; font-size: clamp(18px, 3vw, 30px); line-height: 1.15; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tmx-title small, .tmx-progress { color: var(--muted); font-size: 12px; }
.tmx-actions, .tmx-footer-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.tmx-btn {
  min-height: 34px; padding: 7px 13px; border: 1px solid var(--border); border-radius: 999px;
  background: color-mix(in srgb, var(--surface) 92%, transparent); color: var(--text);
}
.tmx-btn:hover { border-color: color-mix(in srgb, var(--accent) 72%, var(--border)); }
.tmx-btn.primary { background: var(--text); color: var(--bg); border-color: var(--text); }
.tmx-btn:disabled { opacity: .45; cursor: not-allowed; }
.tmx-scroll {
  flex: 1 1 auto; min-height: 0; overflow: auto; overscroll-behavior: contain;
  padding: 16px var(--side-padding) 84px;
}
.tmx-chapter {
  width: 100%; max-width: none; margin: 0; padding: clamp(18px, 4vw, 42px) 0;
}
.tmx-chapter h2 { margin: 0 0 1.1em; font-size: clamp(22px, 4vw, 38px); line-height: 1.18; }
.tmx-content p {
  margin: 0 0 var(--paragraph-spacing); font-size: var(--font-size); line-height: var(--line-height);
  text-align: var(--text-align); text-indent: var(--text-indent); overflow-wrap: break-word;
}
.tmx-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,.28); opacity: 0; pointer-events: none;
  transition: opacity .18s ease; z-index: 20;
}
.tmx-backdrop.open { opacity: 1; pointer-events: auto; }
.tmx-drawer {
  position: fixed; top: 0; bottom: 0; z-index: 21; width: min(390px, 92vw);
  background: color-mix(in srgb, var(--surface) 96%, transparent); color: var(--text);
  border: 1px solid var(--border); backdrop-filter: blur(14px); box-shadow: 0 24px 60px rgba(0,0,0,.25);
  display: flex; flex-direction: column; min-height: 0; transition: transform .2s ease;
}
.tmx-drawer.left { left: 0; transform: translateX(-102%); border-radius: 0 18px 18px 0; }
.tmx-drawer.right { right: 0; transform: translateX(102%); border-radius: 18px 0 0 18px; }
.tmx-drawer.open { transform: translateX(0); }
.tmx-drawer-head { padding: max(12px, env(safe-area-inset-top)) 14px 10px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.tmx-drawer-head h3 { margin: 0; font-size: 16px; }
.tmx-drawer-body { padding: 10px; overflow: auto; min-height: 0; }
.tmx-toc-item {
  width: 100%; text-align: left; padding: 10px 11px; margin: 0 0 6px; border: 1px solid transparent;
  border-radius: 12px; background: transparent;
}
.tmx-toc-item.active { border-color: var(--border); background: color-mix(in srgb, var(--text) 8%, transparent); font-weight: 700; }
.tmx-setting { display: grid; gap: 6px; margin-bottom: 13px; }
.tmx-setting label { font-size: 13px; color: var(--muted); display: flex; justify-content: space-between; gap: 8px; }
.tmx-setting input, .tmx-setting select {
  width: 100%; min-height: 34px; border: 1px solid var(--border); border-radius: 10px; padding: 5px 8px;
  background: color-mix(in srgb, var(--surface) 92%, transparent);
}
body.tmx-fullscreen .tmx-header, body.tmx-fullscreen .tmx-footer {
  position: fixed; left: 0; right: 0; margin: 0; z-index: 15; border-left: 0; border-right: 0;
  border-radius: 0; padding-left: max(10px, env(safe-area-inset-left)); padding-right: max(10px, env(safe-area-inset-right));
  transition: opacity .18s ease, transform .18s ease;
}
body.tmx-fullscreen .tmx-header { top: 0; padding-top: max(6px, env(safe-area-inset-top)); border-top: 0; border-radius: 0 0 12px 12px; }
body.tmx-fullscreen .tmx-footer { bottom: 0; padding-bottom: max(6px, env(safe-area-inset-bottom)); border-bottom: 0; border-radius: 12px 12px 0 0; }
body.tmx-fullscreen:not(.tmx-ui-visible) .tmx-header { opacity: 0; transform: translateY(-12px); pointer-events: none; }
body.tmx-fullscreen:not(.tmx-ui-visible) .tmx-footer { opacity: 0; transform: translateY(12px); pointer-events: none; }
body.tmx-fullscreen .tmx-scroll {
  height: 100vh; height: 100dvh;
  padding-top: max(46px, calc(env(safe-area-inset-top) + 40px));
  padding-bottom: max(58px, calc(env(safe-area-inset-bottom) + 48px));
}
@media (max-width: 720px) {
  .tmx-header { align-items: stretch; flex-direction: column; padding: 7px 8px; }
  .tmx-actions { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); width: 100%; gap: 5px; }
  .tmx-btn { min-height: 31px; padding: 6px 8px; font-size: 12px; }
  .tmx-footer { margin: 6px; padding: 6px 8px; }
  .tmx-progress { order: -1; width: 100%; text-align: center; }
  .tmx-scroll { padding: 10px var(--side-padding) 78px; }
  .tmx-content p { text-align: left; }
}
</style>
</head>
<body>
<div class="tmx-shell">
  <header class="tmx-header">
    <div class="tmx-title">
      <h1 id="book-title"></h1>
      <small id="chapter-sub"></small>
    </div>
    <div class="tmx-actions">
      <button id="btn-toc" class="tmx-btn" type="button">Mục lục</button>
      <button id="btn-settings" class="tmx-btn" type="button">Cài đặt</button>
      <button id="btn-fullscreen" class="tmx-btn primary" type="button">Fullscreen</button>
    </div>
  </header>
  <main id="reader-scroll" class="tmx-scroll">
    <article class="tmx-chapter">
      <h2 id="chapter-title"></h2>
      <div id="chapter-content" class="tmx-content"></div>
    </article>
  </main>
  <footer class="tmx-footer">
    <div class="tmx-footer-actions">
      <button id="btn-prev" class="tmx-btn" type="button">← Chương trước</button>
    </div>
    <div id="progress" class="tmx-progress"></div>
    <div class="tmx-footer-actions">
      <button id="btn-next" class="tmx-btn" type="button">Chương sau →</button>
    </div>
  </footer>
</div>
<div id="backdrop" class="tmx-backdrop"></div>
<aside id="toc-drawer" class="tmx-drawer left" aria-hidden="true">
  <div class="tmx-drawer-head"><h3>Mục lục</h3><button class="tmx-btn" data-close-drawer type="button">Đóng</button></div>
  <div id="toc-list" class="tmx-drawer-body"></div>
</aside>
<aside id="settings-drawer" class="tmx-drawer right" aria-hidden="true">
  <div class="tmx-drawer-head"><h3>Cài đặt đọc</h3><button class="tmx-btn" data-close-drawer type="button">Đóng</button></div>
  <div class="tmx-drawer-body">
    <div class="tmx-setting"><label for="setting-font">Font chữ</label><select id="setting-font">
      <option value="Noto Serif, 'Times New Roman', serif">Noto Serif</option>
      <option value="'Times New Roman', Times, serif">Times New Roman</option>
      <option value="Georgia, serif">Georgia</option>
      <option value="Arial, sans-serif">Arial</option>
      <option value="system-ui, sans-serif">Sans hệ thống</option>
    </select></div>
    <div class="tmx-setting"><label for="setting-size">Cỡ chữ <span id="value-size"></span></label><input id="setting-size" type="range" min="12" max="40" step="1"></div>
    <div class="tmx-setting"><label for="setting-line">Dãn dòng <span id="value-line"></span></label><input id="setting-line" type="range" min="1.2" max="3" step="0.05"></div>
    <div class="tmx-setting"><label for="setting-para">Dãn đoạn <span id="value-para"></span></label><input id="setting-para" type="range" min="0" max="80" step="1"></div>
    <div class="tmx-setting"><label for="setting-indent">Thụt dòng <span id="value-indent"></span></label><input id="setting-indent" type="range" min="0" max="8" step="0.1"></div>
    <div class="tmx-setting"><label for="setting-padding">Lề hai bên <span id="value-padding"></span></label><input id="setting-padding" type="range" min="0" max="240" step="2"></div>
    <div class="tmx-setting"><label for="setting-align">Căn chữ</label><select id="setting-align"><option value="justify">Đều hai bên</option><option value="left">Trái</option><option value="right">Phải</option><option value="center">Giữa</option></select></div>
    <div class="tmx-setting"><label for="setting-bg">Màu nền</label><input id="setting-bg" type="color"></div>
    <div class="tmx-setting"><label for="setting-text">Màu chữ</label><input id="setting-text" type="color"></div>
    <button id="btn-reset-settings" class="tmx-btn" type="button">Khôi phục mặc định</button>
  </div>
</aside>
<script>
(() => {
  const DATA = ${payload};
  const STORAGE_KEY = (DATA.storageKey || "tm-export-reader") + ":settings";
  const POSITION_KEY = (DATA.storageKey || "tm-export-reader") + ":position";
  const DEFAULTS = Object.assign({}, DATA.style || {});
  const state = {
    index: 0,
    settings: Object.assign({}, DEFAULTS),
    saveTimer: 0,
    uiTimer: 0,
    fullscreenFallback: false
  };
  const byId = (id) => document.getElementById(id);
  const els = {
    body: document.body,
    root: document.documentElement,
    bookTitle: byId("book-title"),
    chapterSub: byId("chapter-sub"),
    chapterTitle: byId("chapter-title"),
    content: byId("chapter-content"),
    scroll: byId("reader-scroll"),
    progress: byId("progress"),
    prev: byId("btn-prev"),
    next: byId("btn-next"),
    tocBtn: byId("btn-toc"),
    settingsBtn: byId("btn-settings"),
    fullscreenBtn: byId("btn-fullscreen"),
    tocDrawer: byId("toc-drawer"),
    settingsDrawer: byId("settings-drawer"),
    tocList: byId("toc-list"),
    backdrop: byId("backdrop")
  };
  function clamp(value, min, max, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
  }
  function escapeHtml(text) {
    return String(text || "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }
  function readJson(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (_error) {
      return null;
    }
  }
  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_error) {}
  }
  function normalizeText(text) {
    return String(text || "").replace(/\\r\\n/g, "\\n").replace(/\\r/g, "\\n")
      .replace(/[ \\t]+\\n/g, "\\n").replace(/\\n[ \\t]+/g, "\\n").replace(/\\n{2,}/g, "\\n").trim();
  }
  function renderParagraphs(text) {
    const lines = normalizeText(text).split(/\\n+/).filter((line) => line.trim());
    if (!lines.length) return "<p>Chương trống.</p>";
    return lines.map((line) => "<p>" + escapeHtml(line) + "</p>").join("");
  }
  function currentRatio() {
    const max = els.scroll.scrollHeight - els.scroll.clientHeight;
    return max > 0 ? Math.max(0, Math.min(1, els.scroll.scrollTop / max)) : 0;
  }
  function savePositionNow() {
    window.clearTimeout(state.saveTimer);
    state.saveTimer = 0;
    writeJson(POSITION_KEY, { index: state.index, ratio: currentRatio(), updatedAt: Date.now() });
  }
  function savePositionSoon() {
    window.clearTimeout(state.saveTimer);
    state.saveTimer = window.setTimeout(savePositionNow, 250);
  }
  function applySettings(save) {
    const s = state.settings;
    s.fontSize = clamp(s.fontSize, 12, 40, DEFAULTS.fontSize || 18);
    s.lineHeight = clamp(s.lineHeight, 1.2, 3, DEFAULTS.lineHeight || 1.9);
    s.paragraphSpacing = clamp(s.paragraphSpacing, 0, 80, DEFAULTS.paragraphSpacing || 12);
    s.textIndent = clamp(s.textIndent, 0, 8, Number.isFinite(Number(DEFAULTS.textIndent)) ? Number(DEFAULTS.textIndent) : 0);
    s.paddingX = clamp(s.paddingX, 0, 240, DEFAULTS.paddingX || 18);
    if (!["left", "right", "justify", "center"].includes(s.textAlign)) s.textAlign = DEFAULTS.textAlign || "justify";
    els.root.style.setProperty("--font-family", s.fontFamily || DEFAULTS.fontFamily || "serif");
    els.root.style.setProperty("--font-size", s.fontSize + "px");
    els.root.style.setProperty("--line-height", String(s.lineHeight));
    els.root.style.setProperty("--paragraph-spacing", s.paragraphSpacing + "px");
    els.root.style.setProperty("--text-indent", s.textIndent + "em");
    els.root.style.setProperty("--side-padding", s.paddingX + "px");
    els.root.style.setProperty("--text-align", s.textAlign);
    if (/^#[0-9a-f]{6}$/i.test(String(s.bgColor || ""))) els.root.style.setProperty("--bg", s.bgColor);
    if (/^#[0-9a-f]{6}$/i.test(String(s.textColor || ""))) els.root.style.setProperty("--text", s.textColor);
    syncSettingsForm();
    if (save) writeJson(STORAGE_KEY, s);
  }
  function syncSettingsForm() {
    const s = state.settings;
    const setValue = (id, value) => {
      const el = byId(id);
      if (el) el.value = value;
    };
    setValue("setting-font", s.fontFamily || "");
    setValue("setting-size", s.fontSize);
    setValue("setting-line", s.lineHeight);
    setValue("setting-para", s.paragraphSpacing);
    setValue("setting-indent", s.textIndent);
    setValue("setting-padding", s.paddingX);
    setValue("setting-align", s.textAlign);
    setValue("setting-bg", s.bgColor || DEFAULTS.bgColor || "#f7f4ee");
    setValue("setting-text", s.textColor || DEFAULTS.textColor || "#1f1f1f");
    const setText = (id, value) => {
      const el = byId(id);
      if (el) el.textContent = value;
    };
    setText("value-size", s.fontSize + "px");
    setText("value-line", Number(s.lineHeight).toFixed(2));
    setText("value-para", s.paragraphSpacing + "px");
    setText("value-indent", Number(s.textIndent).toFixed(1) + "em");
    setText("value-padding", s.paddingX + "px");
  }
  function updateProgress() {
    const total = Math.max(1, DATA.chapters.length);
    const percent = (((state.index) + currentRatio()) / total) * 100;
    els.chapterSub.textContent = "Chương " + (state.index + 1) + " / " + total;
    els.progress.textContent = "Chương " + (state.index + 1) + " / " + total + " · " + percent.toFixed(1) + "%";
  }
  function renderToc() {
    els.tocList.innerHTML = DATA.chapters.map((chapter, idx) => {
      const active = idx === state.index ? " active" : "";
      return '<button class="tmx-toc-item' + active + '" type="button" data-index="' + idx + '">' + escapeHtml(chapter.title || ("Chương " + (idx + 1))) + "</button>";
    }).join("");
    els.tocList.querySelectorAll(".tmx-toc-item").forEach((button) => {
      button.addEventListener("click", () => {
        goTo(Number(button.getAttribute("data-index") || 0), false);
        closeDrawers();
      });
    });
  }
  function renderChapter(restore) {
    const chapter = DATA.chapters[state.index] || {};
    els.bookTitle.textContent = DATA.title || "Untitled";
    els.chapterTitle.textContent = chapter.title || ("Chương " + (state.index + 1));
    els.content.innerHTML = renderParagraphs(chapter.text || "");
    els.prev.disabled = state.index <= 0;
    els.next.disabled = state.index >= DATA.chapters.length - 1;
    renderToc();
    updateProgress();
    if (restore) {
      const pos = readJson(POSITION_KEY);
      const ratio = pos && Number(pos.index) === state.index ? clamp(pos.ratio, 0, 1, 0) : 0;
      requestAnimationFrame(() => {
        const max = els.scroll.scrollHeight - els.scroll.clientHeight;
        els.scroll.scrollTop = max > 0 ? Math.floor(max * ratio) : 0;
        updateProgress();
      });
    } else {
      els.scroll.scrollTop = 0;
      savePositionNow();
    }
  }
  function goTo(index, restore) {
    if (index < 0 || index >= DATA.chapters.length) return;
    savePositionNow();
    state.index = index;
    renderChapter(Boolean(restore));
  }
  function go(offset) {
    goTo(state.index + offset, false);
  }
  function openDrawer(which) {
    closeDrawers();
    const drawer = which === "settings" ? els.settingsDrawer : els.tocDrawer;
    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    els.backdrop.classList.add("open");
  }
  function closeDrawers() {
    [els.tocDrawer, els.settingsDrawer].forEach((drawer) => {
      drawer.classList.remove("open");
      drawer.setAttribute("aria-hidden", "true");
    });
    els.backdrop.classList.remove("open");
  }
  function isFullscreenActive() {
    return Boolean(document.fullscreenElement) || state.fullscreenFallback;
  }
  function setFullscreenUiVisible(visible, autoHideMs) {
    window.clearTimeout(state.uiTimer);
    els.body.classList.toggle("tmx-ui-visible", Boolean(visible));
    if (visible && autoHideMs > 0) {
      state.uiTimer = window.setTimeout(() => {
        if (isFullscreenActive()) els.body.classList.remove("tmx-ui-visible");
      }, autoHideMs);
    }
  }
  function refreshFullscreen() {
    if (document.fullscreenElement) state.fullscreenFallback = false;
    const active = isFullscreenActive();
    els.body.classList.toggle("tmx-fullscreen", active);
    els.fullscreenBtn.textContent = active ? "Thoát full" : "Fullscreen";
    setFullscreenUiVisible(active, active ? 2200 : 0);
  }
  async function toggleFullscreen() {
    if (isFullscreenActive()) {
      state.fullscreenFallback = false;
      if (document.fullscreenElement) {
        try { await document.exitFullscreen(); } catch (_error) {}
      }
      refreshFullscreen();
      return;
    }
    try { await document.documentElement.requestFullscreen(); } catch (_error) {}
    if (!document.fullscreenElement) await new Promise((resolve) => window.setTimeout(resolve, 80));
    state.fullscreenFallback = !document.fullscreenElement;
    refreshFullscreen();
  }
  function bindSetting(id, key, parser) {
    const el = byId(id);
    if (!el) return;
    el.addEventListener("input", () => {
      state.settings[key] = parser ? parser(el.value) : el.value;
      applySettings(true);
    });
    el.addEventListener("change", () => {
      state.settings[key] = parser ? parser(el.value) : el.value;
      applySettings(true);
    });
  }
  function initSettings() {
    const saved = readJson(STORAGE_KEY);
    if (saved && typeof saved === "object") state.settings = Object.assign({}, state.settings, saved);
    applySettings(false);
    bindSetting("setting-font", "fontFamily");
    bindSetting("setting-size", "fontSize", Number);
    bindSetting("setting-line", "lineHeight", Number);
    bindSetting("setting-para", "paragraphSpacing", Number);
    bindSetting("setting-indent", "textIndent", Number);
    bindSetting("setting-padding", "paddingX", Number);
    bindSetting("setting-align", "textAlign");
    bindSetting("setting-bg", "bgColor");
    bindSetting("setting-text", "textColor");
    byId("btn-reset-settings").addEventListener("click", () => {
      state.settings = Object.assign({}, DEFAULTS);
      applySettings(true);
    });
  }
  function initPosition() {
    const pos = readJson(POSITION_KEY);
    if (pos && Number.isFinite(Number(pos.index))) {
      state.index = Math.max(0, Math.min(DATA.chapters.length - 1, Number(pos.index)));
    }
  }
  initSettings();
  initPosition();
  renderChapter(true);
  els.scroll.addEventListener("scroll", () => {
    updateProgress();
    savePositionSoon();
  }, { passive: true });
  els.scroll.addEventListener("click", (event) => {
    if (!isFullscreenActive()) return;
    if (event.target.closest("button,input,select,a,label")) return;
    const sel = window.getSelection();
    if (sel && sel.toString().trim()) return;
    setFullscreenUiVisible(!els.body.classList.contains("tmx-ui-visible"), 2200);
  });
  els.prev.addEventListener("click", () => go(-1));
  els.next.addEventListener("click", () => go(1));
  els.tocBtn.addEventListener("click", () => openDrawer("toc"));
  els.settingsBtn.addEventListener("click", () => openDrawer("settings"));
  els.fullscreenBtn.addEventListener("click", toggleFullscreen);
  els.backdrop.addEventListener("click", closeDrawers);
  document.querySelectorAll("[data-close-drawer]").forEach((button) => button.addEventListener("click", closeDrawers));
  document.addEventListener("fullscreenchange", refreshFullscreen);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeDrawers();
      if (state.fullscreenFallback && !document.fullscreenElement) {
        state.fullscreenFallback = false;
        refreshFullscreen();
      }
    }
    if (event.key === "ArrowLeft") go(-1);
    if (event.key === "ArrowRight") go(1);
  });
  window.addEventListener("pagehide", savePositionNow);
  window.addEventListener("beforeunload", savePositionNow);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") savePositionNow();
  });
})();
</script>
</body>
</html>`;
    }

    async function libResolveExportTitles(book, chapters) {
        config = loadConfig();
        const rawBookTitle = book?.title || 'Untitled';
        const rawChapterTitles = chapters.map((ch, idx) => ch.title || `Chương ${idx + 1}`);
        if (!book || book.langSource === 'vi') {
            return {
                bookTitle: rawBookTitle,
                chapterTitles: rawChapterTitles
            };
        }

        const version = config.nameSetVersion || 1;
        const pending = [];
        const bookCacheKey = `book:${book.bookId || ''}:${version}:${rawBookTitle}`;
        if (!libTitleCache.has(bookCacheKey)) {
            pending.push({ key: bookCacheKey, rawTitle: rawBookTitle });
        }

        const chapterCacheKeys = rawChapterTitles.map((title, idx) => {
            const key = `chap:${chapters[idx].chapterId}:${version}:${title}`;
            if (!libTitleCache.has(key)) {
                pending.push({ key, rawTitle: title });
            }
            return key;
        });

        if (pending.length > 0) {
            try {
                const translatedText = await translatePanelText(pending.map(item => item.rawTitle).join('\n'), 'text');
                const lines = translatedText.split(/\r?\n/);
                pending.forEach((item, idx) => {
                    const resolved = (lines[idx] || item.rawTitle || '').trim() || item.rawTitle;
                    libTitleCache.set(item.key, resolved);
                });
            } catch (err) {
                console.error(err);
            }
        }

        return {
            bookTitle: libTitleCache.get(bookCacheKey) || rawBookTitle,
            chapterTitles: rawChapterTitles.map((title, idx) => libTitleCache.get(chapterCacheKeys[idx]) || title)
        };
    }

    async function libGetNormalizedRawChapterContent(chapter) {
        if (!chapter?.rawKey) {
            return { raw: null, rawText: '', wasNormalized: false };
        }
        const raw = await libGet('tm_content', chapter.rawKey);
        if (!raw) {
            return { raw: null, rawText: '', wasNormalized: false };
        }

        const originalText = raw.text || '';
        const wasNormalized = hasInvisibleTextFormatting(originalText);
        if (!wasNormalized) {
            return { raw, rawText: originalText, wasNormalized: false };
        }

        const normalizedText = normalizeTextForTranslation(originalText);
        const now = Date.now();
        raw.text = normalizedText;
        raw.updatedAt = now;
        await libPutMany('tm_content', [raw]);

        if (chapter.transKey) {
            libDeleteContent(chapter.transKey);
            chapter.transKey = null;
            chapter.updatedAt = now;
            await libPutMany('tm_chapters', [chapter]);
        }
        libSetBackupStatus({ state: 'dirty', message: 'Raw/cache truyện có thay đổi chưa sao lưu.' });

        return { raw, rawText: normalizedText, wasNormalized: true };
    }

    async function libCheckMissingTranslations(book, chapters) {
        if (!book || book.langSource !== 'zh') return false;
        for (const chapter of chapters) {
            const { wasNormalized } = await libGetNormalizedRawChapterContent(chapter);
            if (wasNormalized) return true;
            const expectedKey = libMakeTransKey(chapter.chapterId, chapter.rawKey);
            if (chapter.transKey !== expectedKey) return true;
            const cached = await libGet('tm_content', expectedKey);
            if (!cached) return true;
        }
        return false;
    }

    async function libGetExportTextForChapter(book, chapter, ensureTranslated) {
        const { rawText, wasNormalized } = await libGetNormalizedRawChapterContent(chapter);
        const needsRefresh = wasNormalized;

        if (!book || book.langSource === 'vi') return { text: rawText, translated: false };

        const expectedKey = libMakeTransKey(chapter.chapterId, chapter.rawKey);
        if (!needsRefresh && chapter.transKey === expectedKey) {
            const cached = await libGet('tm_content', expectedKey);
            if (cached?.text) return { text: restoreTranslatedNameCasing(cached.text), translated: false };
        }

        if (ensureTranslated) {
            const translated = await libTranslateAndCacheChapter(chapter.chapterId);
            return { text: translated, translated: true };
        }

        return { text: '', translated: false };
    }

    async function libExportBookTxt(bookId) {
        const book = libFindBookInIndex(bookId);
        if (!book) {
            showNotification('Không tìm thấy truyện.');
            return;
        }
        const chapters = await libGetChaptersByBook(bookId);
        if (!chapters.length) {
            showNotification('Truyện chưa có chương.');
            return;
        }

        const needsTranslate = await libCheckMissingTranslations(book, chapters);
        let ensureTranslated = false;
        if (needsTranslate) {
            ensureTranslated = confirm('Có chương chưa có cache dịch. Dịch và cache trước khi xuất?');
            if (!ensureTranslated) {
                showNotification('Hủy xuất do thiếu cache dịch.');
                return;
            }
        }

        showLoading('Đang xuất TXT...');
        try {
            const cfg = loadConfig();
            const { bookTitle: exportBookTitle, chapterTitles } = await libResolveExportTitles(book, chapters);
            const lines = [];
            for (let i = 0; i < chapters.length; i++) {
                const ch = chapters[i];
                const title = chapterTitles[i] || ch.title || `Chương ${i + 1}`;
                if (ensureTranslated && book.langSource === 'zh') {
                    showLoading(`Đang dịch chương ${i + 1}/${chapters.length}...`);
                }
                const { text, translated } = await libGetExportTextForChapter(book, ch, ensureTranslated);
                lines.push(title);
                lines.push('');
                lines.push(text || '');
                lines.push('\n');
                if (ensureTranslated && book.langSource === 'zh' && translated && i < chapters.length - 1) {
                    await sleep(cfg.delayMs || 0);
                }
            }
            showLoading('Đang đóng gói TXT...');
            const filename = `${libSafeFileName(exportBookTitle || book.title)}.txt`;
            libDownloadBlob(new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' }), filename);
            showNotification('Đã xuất TXT.');
        } catch (err) {
            console.error(err);
            showNotification('Xuất TXT thất bại.');
        } finally {
            removeLoading();
        }
    }

    async function libExportBookEpub(bookId) {
        const book = libFindBookInIndex(bookId);
        if (!book) {
            showNotification('Không tìm thấy truyện.');
            return;
        }
        const chapters = await libGetChaptersByBook(bookId);
        if (!chapters.length) {
            showNotification('Truyện chưa có chương.');
            return;
        }

        const needsTranslate = await libCheckMissingTranslations(book, chapters);
        let ensureTranslated = false;
        if (needsTranslate) {
            ensureTranslated = confirm('Có chương chưa có cache dịch. Dịch và cache trước khi xuất?');
            if (!ensureTranslated) {
                showNotification('Hủy xuất do thiếu cache dịch.');
                return;
            }
        }

        showNotification('Đang xuất EPUB... Vui lòng chờ', 4000);
        showLoading('Đang xuất EPUB...');
        try {
            const cfg = loadConfig();
            const { bookTitle: exportBookTitle, chapterTitles } = await libResolveExportTitles(book, chapters);
            if (!window.fflate || !fflate.zipSync || !fflate.strToU8) {
                throw new Error('fflate chưa sẵn sàng.');
            }
            const { zipSync, strToU8 } = fflate;
            const files = {};
            files['mimetype'] = [strToU8('application/epub+zip'), { level: 0 }];
            files['META-INF/container.xml'] = strToU8(`<?xml version="1.0" encoding="UTF-8"?>\n<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">\n  <rootfiles>\n    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>\n  </rootfiles>\n</container>`);

            const manifestItems = [];
            const spineItems = [];
            const navPoints = [];

            for (let i = 0; i < chapters.length; i++) {
                const ch = chapters[i];
                const title = chapterTitles[i] || ch.title || `Chương ${i + 1}`;
                if (ensureTranslated && book.langSource === 'zh') {
                    showLoading(`Đang dịch chương ${i + 1}/${chapters.length}...`);
                }
                const { text, translated } = await libGetExportTextForChapter(book, ch, ensureTranslated);
                const filename = `Text/chapter_${i + 1}.xhtml`;
                const html = `<?xml version="1.0" encoding="utf-8"?>\n<html xmlns="http://www.w3.org/1999/xhtml">\n<head><title>${escapeHtml(title)}</title></head>\n<body>\n<h2>${escapeHtml(title)}</h2>\n${libTextToHtml(text || '')}\n</body>\n</html>`;
                files[`OEBPS/${filename}`] = strToU8(html);

                manifestItems.push(`<item id="chap${i + 1}" href="${filename}" media-type="application/xhtml+xml"/>`);
                spineItems.push(`<itemref idref="chap${i + 1}"/>`);
                navPoints.push(`    <navPoint id="navPoint-${i + 1}" playOrder="${i + 1}">\n      <navLabel><text>${escapeHtml(title)}</text></navLabel>\n      <content src="${filename}"/>\n    </navPoint>`);
                if (ensureTranslated && book.langSource === 'zh' && translated && i < chapters.length - 1) {
                    await sleep(cfg.delayMs || 0);
                }
            }

            const language = 'vi';
            const uid = escapeHtml(book.bookId || libHashString(book.title || 'book'));
            const author = escapeHtml(book.author || '');

            files['OEBPS/toc.ncx'] = strToU8(`<?xml version="1.0" encoding="UTF-8"?>\n<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">\n  <head>\n    <meta name="dtb:uid" content="${uid}"/>\n    <meta name="dtb:depth" content="1"/>\n    <meta name="dtb:totalPageCount" content="0"/>\n    <meta name="dtb:maxPageNumber" content="0"/>\n  </head>\n  <docTitle><text>${escapeHtml(exportBookTitle || book.title || 'Untitled')}</text></docTitle>\n  <navMap>\n${navPoints.join('\n')}\n  </navMap>\n</ncx>`);

            files['OEBPS/content.opf'] = strToU8(`<?xml version="1.0" encoding="UTF-8"?>\n<package xmlns=\"http://www.idpf.org/2007/opf\" unique-identifier=\"BookId\" version=\"2.0\">\n  <metadata xmlns:dc=\"http://purl.org/dc/elements/1.1/\">\n    <dc:title>${escapeHtml(exportBookTitle || book.title || 'Untitled')}</dc:title>\n    <dc:language>${language}</dc:language>\n    <dc:identifier id=\"BookId\">${uid}</dc:identifier>\n    ${author ? `<dc:creator>${author}</dc:creator>` : ''}\n  </metadata>\n  <manifest>\n    <item id=\"ncx\" href=\"toc.ncx\" media-type=\"application/x-dtbncx+xml\"/>\n    ${manifestItems.join('\n    ')}\n  </manifest>\n  <spine toc=\"ncx\">\n    ${spineItems.join('\n    ')}\n  </spine>\n</package>`);

            showLoading('Đang đóng gói EPUB...');
            const zipped = zipSync(files, { level: 6 });
            const blob = new Blob([zipped], { type: 'application/epub+zip' });
            const filename = `${libSafeFileName(exportBookTitle || book.title)}.epub`;
            libDownloadBlob(blob, filename);
            showNotification('Đã xuất EPUB.');
        } catch (err) {
            console.error(err);
            showNotification('Xuất EPUB thất bại.');
        } finally {
            removeLoading();
        }
    }

    async function libExportBookHtml(bookId) {
        const book = libFindBookInIndex(bookId);
        if (!book) {
            showNotification('Không tìm thấy truyện.');
            return;
        }
        const chapters = await libGetChaptersByBook(bookId);
        if (!chapters.length) {
            showNotification('Truyện chưa có chương.');
            return;
        }

        const exportRecommendation = libGetExportRecommendation({
            ...book,
            chapterCount: chapters.length
        });
        if (exportRecommendation.recommended === 'epub') {
            const levelText = exportRecommendation.stronglyWarnHtml ? 'rất lớn' : 'khá lớn';
            const ok = confirm(`Truyện ${levelText} (${exportRecommendation.detail}). File HTML nhúng toàn bộ data nên mở/xem có thể lag mạnh; nên dùng EPUB cho bộ này.\n\nVẫn xuất HTML?`);
            if (!ok) {
                showNotification('Đã hủy xuất HTML. Nên chọn Xuất EPUB cho truyện lớn.');
                return;
            }
        }

        const needsTranslate = await libCheckMissingTranslations(book, chapters);
        let ensureTranslated = false;
        if (needsTranslate) {
            ensureTranslated = confirm('Có chương chưa có cache dịch. Dịch và cache trước khi xuất?');
            if (!ensureTranslated) {
                showNotification('Hủy xuất do thiếu cache dịch.');
                return;
            }
        }

        showNotification('Đang xuất HTML... Vui lòng chờ', 4000);
        showLoading('Đang xuất HTML...');
        try {
            const cfg = loadConfig();
            const { bookTitle: exportBookTitle, chapterTitles } = await libResolveExportTitles(book, chapters);
            const exportChapters = [];
            for (let i = 0; i < chapters.length; i++) {
                const ch = chapters[i];
                const title = chapterTitles[i] || ch.title || `Chương ${i + 1}`;
                if (ensureTranslated && book.langSource === 'zh') {
                    showLoading(`Đang dịch chương ${i + 1}/${chapters.length}...`);
                }
                const { text, translated } = await libGetExportTextForChapter(book, ch, ensureTranslated);
                exportChapters.push({
                    title,
                    text: libNormalizeChapterParagraphBreaks(text || '')
                });
                if (ensureTranslated && book.langSource === 'zh' && translated && i < chapters.length - 1) {
                    await sleep(cfg.delayMs || 0);
                }
            }
            showLoading('Đang đóng gói HTML...');
            const html = libBuildReaderExportHtml(book, exportBookTitle, exportChapters, cfg.readerStyle || DEFAULT_CONFIG.readerStyle);
            const filename = `${libSafeFileName(exportBookTitle || book.title)}.html`;
            libDownloadBlob(new Blob([html], { type: 'text/html;charset=utf-8' }), filename);
            showNotification('Đã xuất HTML.');
        } catch (err) {
            console.error(err);
            showNotification('Xuất HTML thất bại.');
        } finally {
            removeLoading();
        }
    }

    async function libDeleteBook(bookId) {
        const book = libFindBookInIndex(bookId);
        if (!book) {
            showNotification('Không tìm thấy truyện.');
            return;
        }
        if (!confirm(`Xóa truyện "${book.title || 'Untitled'}"? Dữ liệu sẽ bị xóa vĩnh viễn.`)) {
            return;
        }

        showLoading('Đang xóa truyện...');
        try {
            const chapters = libLoadChaptersForBook(bookId);
            chapters.forEach(ch => {
                if (ch.rawKey) libDeleteContent(ch.rawKey);
                if (ch.transKey) libDeleteContent(ch.transKey);
            });
            libDeleteChaptersForBook(bookId);

            const index = libLoadIndex();
            index.books = (index.books || []).filter(b => b.bookId !== bookId);
            libSaveIndex(index);
            libSetBackupStatus({ state: 'dirty', message: 'Thư viện có thay đổi chưa sao lưu.' });

            showNotification('Đã xóa truyện.');
        } catch (err) {
            console.error(err);
            showNotification('Xóa truyện thất bại.');
        } finally {
            removeLoading();
        }
    }

    // NEW: EPUB import helpers
    function libParseXml(xmlText) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlText, 'application/xml');
        const parserErrors = doc.getElementsByTagName('parsererror');
        if (parserErrors && parserErrors.length) {
            throw new Error('XML không hợp lệ.');
        }
        return doc;
    }

    function libFindFirstByLocalName(root, localName) {
        if (!root) return null;
        const all = root.getElementsByTagName('*');
        for (let i = 0; i < all.length; i++) {
            const el = all[i];
            if (el.localName === localName) return el;
        }
        return null;
    }

    function libFindAllByLocalName(root, localName) {
        if (!root) return [];
        const all = root.getElementsByTagName('*');
        const result = [];
        for (let i = 0; i < all.length; i++) {
            const el = all[i];
            if (el.localName === localName) result.push(el);
        }
        return result;
    }

    function libResolveZipPath(basePath, href) {
        if (!href) return '';
        let path = href.split('#')[0];
        if (path.startsWith('/')) path = path.slice(1);
        const baseDir = basePath && basePath.includes('/') ? basePath.slice(0, basePath.lastIndexOf('/') + 1) : '';
        const combined = path.startsWith('/') ? path.slice(1) : `${baseDir}${path}`;
        const parts = combined.split('/').filter(Boolean);
        const stack = [];
        for (const part of parts) {
            if (part === '.') continue;
            if (part === '..') stack.pop();
            else stack.push(part);
        }
        return stack.join('/');
    }

    function libExtractTextFromHtml(htmlText) {
        const doc = new DOMParser().parseFromString(htmlText, 'text/html');
        if (!doc || !doc.body) return '';
        const blockTags = new Set([
            'p', 'div', 'section', 'article', 'header', 'footer', 'aside',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'ul', 'ol',
            'table', 'thead', 'tbody', 'tr', 'td', 'th', 'blockquote'
        ]);
        let out = '';
        function walk(node) {
            if (node.nodeType === 3) {
                out += node.nodeValue || '';
                return;
            }
            if (node.nodeType !== 1) return;
            const tag = (node.tagName || '').toLowerCase();
            if (tag === 'br') {
                out += '\n';
                return;
            }
            const isBlock = blockTags.has(tag);
            if (isBlock) out += '\n';
            let child = node.firstChild;
            while (child) {
                walk(child);
                child = child.nextSibling;
            }
            if (isBlock) out += '\n';
        }
        walk(doc.body);
        return out
            .replace(/\u00a0/g, ' ')
            .replace(/[ \t]+\n/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }

    async function libImportChaptersToLibrary(chapters, langSource, title, author) {
        const now = Date.now();
        const safeTitle = normalizeTextForTranslation((title || 'Untitled').trim()) || 'Untitled';
        const safeAuthor = normalizeTextForTranslation((author || '').trim());
        const bookId = libMakeBookId(safeTitle, safeAuthor, now);
        const lang = langSource === 'vi' ? 'vi' : 'zh';

        const chapterItems = [];
        const contentItems = [];
        const encoder = new TextEncoder();
        let contentBytes = 0;

        chapters.forEach((ch, idx) => {
            const chapterTitle = normalizeTextForTranslation((ch.title || `Chương ${idx + 1}`).trim()) || `Chương ${idx + 1}`;
            const chapterText = libNormalizeChapterParagraphBreaks(ch.text || '');
            contentBytes += encoder.encode(chapterText).length;
            const chapterId = libMakeChapterId(bookId, idx + 1, chapterTitle);
            const rawKey = libMakeRawKey(chapterId, chapterText);
            contentItems.push({
                key: rawKey,
                text: chapterText,
                lang: lang,
                createdAt: now,
                updatedAt: now
            });
            chapterItems.push({
                chapterId: chapterId,
                bookId: bookId,
                order: idx + 1,
                title: chapterTitle,
                rawKey: rawKey,
                transKey: null,
                updatedAt: now
            });
        });

        const index = libLoadIndex();
        index.books = index.books || [];
        index.books.unshift({
            bookId: bookId,
            title: safeTitle,
            author: safeAuthor,
            langSource: lang,
            createdAt: now,
            updatedAt: now,
            chapterCount: chapters.length,
            contentBytes
        });
        index.nameSetVersion = config.nameSetVersion || 1;
        libSaveIndex(index);

        await libPutMany('tm_content', contentItems);
        await libPutMany('tm_chapters', chapterItems);
        libSetBackupStatus({ state: 'dirty', message: 'Có truyện mới chưa sao lưu.' });

        return { bookId, title, chapterCount: chapters.length };
    }

    async function libImportEpubToLibrary(file, langSource, customTitle) {
        if (!window.fflate || !fflate.unzipSync) {
            throw new Error('fflate chưa sẵn sàng.');
        }

        showLoading('Đang mở EPUB...');
        await sleep(0);
        const buffer = await file.arrayBuffer();
        showLoading('Đang giải nén EPUB...');
        const u8 = new Uint8Array(buffer);
        const zip = fflate.unzipSync(u8);
        const decoder = new TextDecoder('utf-8');
        const getEntry = (path) => zip[path] || zip[decodeURIComponent(path)] || zip[path.replace(/\\/g, '/')];
        const getText = (path) => {
            const data = getEntry(path);
            if (!data) return null;
            return decoder.decode(data);
        };

        showLoading('Đang đọc container.xml...');
        const containerXml = getText('META-INF/container.xml');
        if (!containerXml) throw new Error('Không tìm thấy container.xml');
        const containerDoc = libParseXml(containerXml);
        const rootfile = libFindFirstByLocalName(containerDoc, 'rootfile');
        if (!rootfile) throw new Error('Không tìm thấy rootfile trong container.xml');
        const opfPath = rootfile.getAttribute('full-path');
        if (!opfPath) throw new Error('Thiếu đường dẫn OPF.');

        showLoading('Đang đọc content.opf...');
        const opfXml = getText(opfPath);
        if (!opfXml) throw new Error('Không tìm thấy file OPF.');
        const opfDoc = libParseXml(opfXml);

        const metadataEl = libFindFirstByLocalName(opfDoc, 'metadata') || opfDoc;
        const dcTitle = libFindFirstByLocalName(metadataEl, 'title');
        const dcCreator = libFindFirstByLocalName(metadataEl, 'creator');
        const title = (customTitle && customTitle.trim()) || (dcTitle?.textContent || '').trim() || file.name.replace(/\.[^.]+$/, '') || 'Untitled';
        const author = (dcCreator?.textContent || '').trim();

        const manifest = new Map();
        libFindAllByLocalName(opfDoc, 'item').forEach(item => {
            if (item.parentNode && item.parentNode.localName !== 'manifest') return;
            const id = item.getAttribute('id');
            const href = item.getAttribute('href');
            const mediaType = item.getAttribute('media-type') || '';
            if (id && href) {
                const resolved = libResolveZipPath(opfPath, href);
                manifest.set(id, { href, resolved, mediaType });
            }
        });

        const spine = [];
        libFindAllByLocalName(opfDoc, 'itemref').forEach(itemref => {
            if (itemref.parentNode && itemref.parentNode.localName !== 'spine') return;
            const idref = itemref.getAttribute('idref');
            if (idref && manifest.has(idref)) spine.push(idref);
        });

        let tocMap = new Map();
        const spineEl = libFindFirstByLocalName(opfDoc, 'spine');
        const tocId = spineEl?.getAttribute('toc');
        let tocItem = null;
        if (tocId && manifest.has(tocId)) tocItem = manifest.get(tocId);
        if (!tocItem) {
            for (const item of manifest.values()) {
                if ((item.mediaType || '').includes('ncx')) {
                    tocItem = item;
                    break;
                }
            }
        }

        if (tocItem) {
            const tocXml = getText(tocItem.resolved);
            if (tocXml) {
                const tocDoc = libParseXml(tocXml);
                const navPoints = libFindAllByLocalName(tocDoc, 'navPoint');
                navPoints.forEach(navPoint => {
                    const textEl = libFindFirstByLocalName(navPoint, 'text');
                    const contentEl = libFindFirstByLocalName(navPoint, 'content');
                    const src = contentEl?.getAttribute('src') || '';
                    const label = (textEl?.textContent || '').trim();
                    if (src) {
                        const resolved = libResolveZipPath(tocItem.resolved, src);
                        tocMap.set(resolved, label);
                    }
                });
            }
        }

        const chapters = [];
        for (let i = 0; i < spine.length; i++) {
            showLoading(`Đang đọc EPUB... (${i + 1}/${spine.length})`);
            const idref = spine[i];
            const item = manifest.get(idref);
            if (!item) continue;
            const filePath = item.resolved;
            const htmlText = getText(filePath);
            if (!htmlText) continue;
            const text = libExtractTextFromHtml(htmlText);
            if (!text) continue;

            let chapterTitle = tocMap.get(filePath) || '';
            if (!chapterTitle) {
                const doc = new DOMParser().parseFromString(htmlText, 'text/html');
                chapterTitle = doc.querySelector('h1, h2, title')?.textContent?.trim() || '';
            }
            if (!chapterTitle) chapterTitle = `Chương ${chapters.length + 1}`;
            chapters.push({ title: chapterTitle, text });
        }

        if (!chapters.length) throw new Error('Không tìm thấy chương trong EPUB.');
        return await libImportChaptersToLibrary(chapters, langSource, title, author);
    }

    function libNormalizeTextForSplit(text) {
        let normalized = normalizeTextForTranslation(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        normalized = normalized.replace(/[ \t]+\n/g, '\n');
        normalized = normalized.replace(/\n{3,}/g, '\n\n');
        return normalized.trim();
    }

    function libNormalizeChapterParagraphBreaks(text) {
        let normalized = normalizeTextForTranslation(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        normalized = normalized.replace(/[ \t]+\n/g, '\n').replace(/\n[ \t]+/g, '\n');
        normalized = normalized.replace(/\n{2,}/g, '\n');
        return normalized.trim();
    }

    function libMergeShortChapters(chapters, minLen) {
        if (!Array.isArray(chapters) || chapters.length === 0) return chapters || [];
        const merged = [];
        let buffer = null;

        for (const ch of chapters) {
            if (!ch || !ch.text || !ch.text.trim()) continue;
            if (!buffer) {
                buffer = { ...ch };
                continue;
            }
            if ((buffer.text || '').length < minLen) {
                buffer.text = `${buffer.text}\n\n${ch.text}`.trim();
            } else {
                merged.push(buffer);
                buffer = { ...ch };
            }
        }
        if (buffer) {
            if (buffer.text.length < minLen && merged.length > 0) {
                merged[merged.length - 1].text = `${merged[merged.length - 1].text}\n\n${buffer.text}`.trim();
            } else {
                merged.push(buffer);
            }
        }
        return merged;
    }

    function libSplitLongBlock(text, maxLen) {
        const cleaned = (text || '').trim();
        if (!cleaned) return [];
        const chunks = [];
        let buf = '';
        const seps = new Set(['。', '！', '？', '!', '?', '；', ';', '…', '.', '，', ',', '、', ':', '：']);
        for (let i = 0; i < cleaned.length; i++) {
            const ch = cleaned[i];
            buf += ch;
            if (buf.length >= maxLen) {
                chunks.push(buf.trim());
                buf = '';
                continue;
            }
            if (seps.has(ch) && buf.length >= Math.floor(maxLen * 0.5)) {
                chunks.push(buf.trim());
                buf = '';
            }
        }
        if (buf.trim()) chunks.push(buf.trim());

        const finalChunks = [];
        for (const chunk of chunks) {
            if (chunk.length <= maxLen) {
                finalChunks.push(chunk);
            } else {
                for (let i = 0; i < chunk.length; i += maxLen) {
                    finalChunks.push(chunk.slice(i, i + maxLen));
                }
            }
        }
        return finalChunks;
    }

    function libSplitByNewlines(normalized, cfg) {
        if (!normalized) return [];
        const targetSize = Math.max(4000, (cfg?.maxCharsPerRequest || 4500));
        const maxChapterLen = Math.max(targetSize * 2, 9000);
        let parts = normalized.split(/\n{2,}/).map(s => s.trim()).filter(Boolean);
        let joiner = '\n\n';
        if (parts.length <= 1) {
            parts = normalized.split(/\n+/).map(s => s.trim()).filter(Boolean);
            joiner = '\n';
        }
        const expandedParts = [];
        for (const part of parts) {
            if (part.length > maxChapterLen) {
                expandedParts.push(...libSplitLongBlock(part, maxChapterLen));
            } else {
                expandedParts.push(part);
            }
        }
        parts = expandedParts;
        const total = parts.reduce((sum, s) => sum + s.length, 0);
        const desired = Math.max(1, Math.round(total / targetSize));
        const avgSize = Math.max(1, Math.ceil(total / desired));
        const chapters = [];
        let cur = [];
        let curLen = 0;
        for (const part of parts) {
            const addLen = part.length + (cur.length ? joiner.length : 0);
            if (cur.length > 0 && curLen + addLen > avgSize && chapters.length < desired - 1) {
                chapters.push(cur.join(joiner));
                cur = [part];
                curLen = part.length;
            } else {
                cur.push(part);
                curLen += addLen;
            }
        }
        if (cur.length) chapters.push(cur.join(joiner));
        const minLen = Math.max(800, Math.floor(targetSize * 0.25));
        return libMergeShortChapters(
            chapters.map((content, idx) => ({ title: `Chương ${idx + 1}`, text: content.trim() })),
            minLen
        );
    }

    function libCleanChapterHeadingTitle(title) {
        return String(title || '')
            .replace(/^\uFEFF/, '')
            .replace(/\s*[（(]?\d{1,7}\s*字[）)]?\s*$/i, '')
            .trim();
    }

    function libExtractChapterHeadingKey(title) {
        const raw = String(title || '').trim();
        let match = raw.match(/第\s*([\d一二三四五六七八九十百千万萬零〇两兩]+)\s*章/i);
        if (match) return `zh:${match[1].replace(/萬/g, '万').replace(/〇/g, '零').replace(/兩/g, '两')}`;
        match = raw.match(/^(?:Chương|CHƯƠNG|Chuong|CHUONG|Chapter|CHAPTER)\s*([0-9]+)/i);
        if (match) return `num:${parseInt(match[1], 10)}`;
        return '';
    }

    function libCollectChapterHeadingMatches(normalized) {
        const headingRegex = /^(?:\s*)(?:Chương|CHƯƠNG|Chuong|CHUONG|Chapter|CHAPTER|卷|第\s*[\d一二三四五六七八九十百千万萬零〇两兩]+?\s*章)[^\n]{0,80}$/gm;
        const rawMatches = Array.from(normalized.matchAll(headingRegex)).map(match => {
            const raw = match[0] || '';
            const index = match.index || 0;
            return {
                index,
                contentStart: index + raw.length,
                title: libCleanChapterHeadingTitle(raw),
                chapterKey: libExtractChapterHeadingKey(raw)
            };
        });
        const matches = [];
        for (const item of rawMatches) {
            const prev = matches[matches.length - 1];
            if (prev && item.chapterKey && prev.chapterKey === item.chapterKey) {
                const between = normalized.slice(prev.contentStart, item.index).trim();
                if (!between) {
                    prev.contentStart = item.index;
                    prev.title = item.title || prev.title;
                    continue;
                }
            }
            matches.push(item);
        }
        return matches;
    }

    function libSplitChaptersFromText(text) {
        const cfg = config || loadConfig();
        const normalized = libNormalizeTextForSplit(text);
        const matches = libCollectChapterHeadingMatches(normalized);
        if (matches.length === 0) {
            return libSplitByNewlines(normalized, cfg);
        }

        const chapters = [];
        if (matches[0].index > 0) {
            const preface = libNormalizeTextForSplit(normalized.slice(0, matches[0].index));
            if (preface) chapters.push({ title: 'Mở đầu', text: preface });
        }
        for (let i = 0; i < matches.length; i++) {
            const title = matches[i].title;
            const start = matches[i].contentStart;
            const end = i + 1 < matches.length ? matches[i + 1].index : normalized.length;
            const content = libNormalizeTextForSplit(normalized.slice(start, end));
            if (!content) continue;
            chapters.push({ title: title || `Chương ${i + 1}`, text: content });
        }
        const targetSize = Math.max(4000, (cfg?.maxCharsPerRequest || 4500));
        const minLen = Math.max(800, Math.floor(targetSize * 0.25));
        const maxChapterLen = Math.max(targetSize * 2, 9000);
        const avgLen = chapters.length ? chapters.reduce((sum, c) => sum + (c.text || '').length, 0) / chapters.length : 0;
        const tooShortCount = chapters.filter(c => (c.text || '').length < minLen / 2).length;
        const tooLongCount = chapters.filter(c => (c.text || '').length > maxChapterLen).length;
        const shouldFallback = chapters.length > 5 && (
            avgLen < minLen * 0.6 ||
            tooShortCount / chapters.length > 0.6 ||
            tooLongCount > 0
        );
        if (shouldFallback) {
            return libSplitByNewlines(normalized, cfg);
        }
        return chapters;
    }

    async function libImportTextToLibrary(file, langSource, customTitle) {
        const text = await file.text();
        const title = (customTitle && customTitle.trim()) || file.name.replace(/\.[^.]+$/, '') || 'Untitled';
        const chapters = libSplitChaptersFromText(text);
        return await libImportChaptersToLibrary(chapters, langSource, title, '');
    }

    async function libTranslateAndCacheChapter(chapterId) {
        const chapter = await libGet('tm_chapters', chapterId);
        if (!chapter || !chapter.rawKey) throw new Error('Không tìm thấy chương.');
        const { raw, rawText } = await libGetNormalizedRawChapterContent(chapter);
        if (!raw) throw new Error('Không tìm thấy nội dung gốc.');

        const translated = await translatePanelText(rawText, 'text');
        const transKey = libMakeTransKey(chapterId, chapter.rawKey);
        const now = Date.now();

        await libPutMany('tm_content', [{
            key: transKey,
            text: translated,
            lang: 'vi',
            createdAt: now,
            updatedAt: now
        }]);

        chapter.transKey = transKey;
        chapter.updatedAt = now;
        await libPutMany('tm_chapters', [chapter]);
        libSetBackupStatus({ state: 'dirty', message: 'Cache dịch có thay đổi chưa sao lưu.' });

        return translated;
    }

    function openLibraryImportModal() {
        removeElementById('tm-lib-import-modal');
        const wrapper = document.createElement('div');
        wrapper.id = 'tm-lib-import-modal';
        wrapper.className = 'tm-modal-wrapper';
        wrapper.style.zIndex = '2147483661';

        wrapper.innerHTML = `
        <div class="tm-modal-backdrop"></div>
        <div class="tm-modal-box" style="width: 520px;">
            <div class="tm-modal-header">
                <h3>Nhập truyện vào thư viện</h3>
                <button class="tm-btn" id="tm-lib-import-close">&times;</button>
            </div>
            <div class="tm-modal-content">
                <label class="tm-label">File TXT/EPUB</label>
                <input id="tm-lib-file" class="tm-input" type="file" accept=".txt,.epub" />
                <label class="tm-label">Nguồn văn bản</label>
                <select id="tm-lib-lang" class="tm-input">
                    <option value="zh">Tiếng Trung (RAW)</option>
                    <option value="vi">Tiếng Việt (KHÔNG dịch)</option>
                </select>
                <label class="tm-label">Tiêu đề truyện (tùy chọn)</label>
                <input id="tm-lib-title" class="tm-input" placeholder="Để trống để lấy theo tên file" />
            </div>
            <div class="tm-modal-footer">
                <button class="tm-btn" id="tm-lib-import-start">Import</button>
            </div>
        </div>
        `;

        tmUIRoot.appendChild(wrapper);

        const fileInput = wrapper.querySelector('#tm-lib-file');
        const titleInput = wrapper.querySelector('#tm-lib-title');
        const langSelect = wrapper.querySelector('#tm-lib-lang');
        const close = () => wrapper.remove();

        fileInput.addEventListener('change', () => {
            if (!titleInput.value && fileInput.files && fileInput.files[0]) {
                titleInput.value = fileInput.files[0].name.replace(/\.[^.]+$/, '');
            }
        });

        wrapper.querySelector('#tm-lib-import-close').addEventListener('click', close);
        wrapper.querySelector('.tm-modal-backdrop').addEventListener('click', close);

        wrapper.querySelector('#tm-lib-import-start').addEventListener('click', async () => {
            const file = fileInput.files && fileInput.files[0];
            if (!file) {
                showNotification('Chưa chọn file.');
                return;
            }
            const ext = file.name.split('.').pop().toLowerCase();
            const langSource = langSelect.value === 'vi' ? 'vi' : 'zh';
            const title = titleInput.value;
            let isSuccess = false;

            try {
                showLoading('Đang import...');
                if (ext === 'epub') {
                    const result = await libImportEpubToLibrary(file, langSource, title);
                    showNotification(`Đã import: ${result.title} (${result.chapterCount} chương)`);
                    isSuccess = true;
                } else if (ext === 'txt') {
                    const result = await libImportTextToLibrary(file, langSource, title);
                    showNotification(`Đã import: ${result.title} (${result.chapterCount} chương)`);
                    isSuccess = true;
                } else {
                    showNotification('Chỉ hỗ trợ TXT/EPUB.');
                }
            } catch (err) {
                console.error(err);
                showNotification('Import thất bại: ' + (err.message || 'Lỗi không rõ'));
            } finally {
                removeLoading();
                if (isSuccess) {
                    close();
                    openLibraryListModal();
                }
            }
        });
    }

    function openLibraryListModal() {
        removeElementById('tm-lib-list-modal');
        const wrapper = document.createElement('div');
        wrapper.id = 'tm-lib-list-modal';
        wrapper.className = 'tm-modal-wrapper';
        wrapper.style.zIndex = '2147483661';
        wrapper.innerHTML = `
        <div class="tm-modal-backdrop"></div>
        <div class="tm-library-shell">
            <section class="tm-library-main">
                <div class="tm-library-topbar">
                    <div class="tm-library-titleblock">
                        <h2>Thư viện</h2>
                        <div id="tm-lib-total" class="tm-library-muted">Đang tải...</div>
                        <div id="tm-lib-result-meta" class="tm-library-result-meta"></div>
                    </div>
                    <div class="tm-library-searchbox">
                        <div class="tm-library-searchrow">
                            <input id="tm-lib-search" class="tm-input" placeholder="Tìm truyện..." autocomplete="off" />
                            <button class="tm-btn" id="tm-lib-filter-btn" type="button">Lọc</button>
                        </div>
                        <div id="tm-lib-filter-pop" class="tm-library-filter-pop">
                            <label class="tm-library-check"><input type="checkbox" data-scope="title" checked> Tên truyện</label>
                            <label class="tm-library-check"><input type="checkbox" data-scope="author" checked> Tác giả</label>
                            <label class="tm-library-check"><input type="checkbox" data-scope="raw"> Raw Trung</label>
                            <label class="tm-library-check"><input type="checkbox" data-scope="cache"> Cache dịch</label>
                        </div>
                    </div>
                    <div class="tm-library-toolbar">
                        <div id="tm-lib-load-hint" class="tm-library-result-meta tm-library-load-hint" hidden></div>
                        <div id="tm-lib-backup-status" class="tm-library-backup-status" title="Chưa sao lưu">Chưa sao lưu</div>
                        <div class="tm-library-menu-wrap">
                            <button class="tm-btn tm-library-menu-btn" id="tm-lib-menu-btn" type="button" title="Tùy chọn thư viện">☰</button>
                            <div class="tm-library-menu" id="tm-lib-menu">
                                <button class="tm-btn tm-btn-primary" id="tm-lib-import-open" type="button">Import TXT/EPUB</button>
                                <button class="tm-btn" id="tm-lib-clear-cache" type="button">Xóa cache dịch</button>
                                <div class="tm-library-menu-row">
                                    <button class="tm-btn" id="tm-lib-backup" type="button">Sao lưu</button>
                                    <button class="tm-btn" id="tm-lib-restore" type="button">Khôi phục</button>
                                </div>
                            </div>
                        </div>
                        <button class="tm-btn tm-library-close" id="tm-lib-list-close" title="Đóng">×</button>
                    </div>
                </div>
                <div id="tm-lib-scroll" class="tm-library-scroll">
                    <div id="tm-lib-migration-slot"></div>
                    <div id="tm-lib-grid" class="tm-library-grid"></div>
                    <button id="tm-lib-load-more" class="tm-btn tm-library-loadmore" type="button" hidden>Tải thêm</button>
                </div>
            </section>
        </div>
        `;
        tmUIRoot.appendChild(wrapper);

        const state = {
            allBooks: libSortBooksForLibrary((libLoadIndex().books || [])),
            filteredBooks: [],
            visibleCount: LIB_LIST_PAGE_SIZE,
            searchTimer: 0,
            renderToken: 0
        };
        const grid = wrapper.querySelector('#tm-lib-grid');
        const scrollEl = wrapper.querySelector('#tm-lib-scroll');
        const totalEl = wrapper.querySelector('#tm-lib-total');
        const metaEl = wrapper.querySelector('#tm-lib-result-meta');
        const loadHintEl = wrapper.querySelector('#tm-lib-load-hint');
        const searchInput = wrapper.querySelector('#tm-lib-search');
        const filterBtn = wrapper.querySelector('#tm-lib-filter-btn');
        const filterPop = wrapper.querySelector('#tm-lib-filter-pop');
        const loadMoreBtn = wrapper.querySelector('#tm-lib-load-more');
        const backupStatusEl = wrapper.querySelector('#tm-lib-backup-status');
        const menuBtn = wrapper.querySelector('#tm-lib-menu-btn');
        const menuEl = wrapper.querySelector('#tm-lib-menu');
        const close = () => wrapper.remove();
        const closeMenu = () => menuEl?.classList.remove('open');
        const closeFilter = () => filterPop?.classList.remove('open');

        const getScopes = () => new Set(Array.from(filterPop.querySelectorAll('input[type="checkbox"]'))
            .filter(input => input.checked)
            .map(input => input.dataset.scope)
            .filter(Boolean));

        const formatProgressText = (book) => {
            const total = book?.chapterCount || 0;
            if (!total || !book?.lastReadChapterId) return 'Chưa đọc';
            const order = book.lastReadOrder;
            if (!order) return 'Đang đọc...';
            const ratio = typeof book.lastReadScrollRatio === 'number' ? book.lastReadScrollRatio : 0;
            const percent = Math.max(0, Math.min(100, (((order - 1) + ratio) / Math.max(1, total)) * 100));
            return `Chương ${order}/${total} · ${percent.toFixed(1)}%`;
        };

        const renderBookCard = (book) => `
            <div class="tm-library-card tm-card" data-book-id="${escapeHtml(book.bookId)}">
                <div class="tm-library-cover-wrap">
                    <img class="tm-library-cover" src="${escapeHtml(libGetBookCoverSrc(book))}" alt="Bìa ${escapeHtml(book.title || 'truyện')}" loading="lazy">
                    <button class="tm-btn tm-library-cover-btn tm-lib-cover-change" data-book-id="${escapeHtml(book.bookId)}" type="button">Đổi bìa</button>
                </div>
                <div class="tm-library-card-main">
                    <div class="tm-library-title tm-lib-book-title" data-raw-title="${escapeHtml(book.title || 'Untitled')}">${escapeHtml(book.title || 'Untitled')}</div>
                    <div class="tm-library-author">${book.author ? `Tác giả: ${escapeHtml(book.author)}` : 'Chưa có tác giả'}</div>
                    <div class="tm-library-meta">${book.chapterCount || 0} chương · Nguồn: ${(book.langSource || 'zh').toUpperCase()} · ${libEstimateExportBytes(book).bytes ? libFormatBytes(libEstimateExportBytes(book).bytes) : 'chưa rõ dung lượng'}</div>
                    <div id="tm-lib-progress-${escapeHtml(book.bookId)}" class="tm-library-progress">Tiến độ: ${formatProgressText(book)}</div>
                    <div class="tm-library-card-actions">
                        <button class="tm-btn tm-btn-primary tm-lib-open" data-book-id="${escapeHtml(book.bookId)}">Mở</button>
                        <button class="tm-btn tm-lib-export-txt" data-book-id="${escapeHtml(book.bookId)}">TXT</button>
                        ${libRenderExportButton('EPUB', 'epub', book)}
                        ${libRenderExportButton('HTML', 'html', book)}
                        <button class="tm-btn tm-lib-delete" data-book-id="${escapeHtml(book.bookId)}" style="border-color:#dc3545;color:#dc3545;">Xóa</button>
                    </div>
                </div>
            </div>
        `;

        const bindCardActions = () => {
            grid.querySelectorAll('.tm-lib-open').forEach(btn => {
                btn.onclick = () => {
                    const bookId = btn.getAttribute('data-book-id');
                    close();
                    if (bookId) openLibraryReader(bookId);
                };
            });
            grid.querySelectorAll('.tm-lib-export-txt').forEach(btn => {
                btn.onclick = async () => {
                    const bookId = btn.getAttribute('data-book-id');
                    if (bookId) await libExportBookTxt(bookId);
                };
            });
            grid.querySelectorAll('.tm-lib-export-epub').forEach(btn => {
                btn.onclick = async () => {
                    const bookId = btn.getAttribute('data-book-id');
                    if (bookId) await libExportBookEpub(bookId);
                };
            });
            grid.querySelectorAll('.tm-lib-export-html').forEach(btn => {
                btn.onclick = async () => {
                    const bookId = btn.getAttribute('data-book-id');
                    if (bookId) await libExportBookHtml(bookId);
                };
            });
            grid.querySelectorAll('.tm-lib-delete').forEach(btn => {
                btn.onclick = async () => {
                    const bookId = btn.getAttribute('data-book-id');
                    if (!bookId) return;
                    await libDeleteBook(bookId);
                    state.allBooks = libSortBooksForLibrary((libLoadIndex().books || []));
                    await applyFilter(true);
                };
            });
            grid.querySelectorAll('.tm-lib-cover-change').forEach(btn => {
                btn.onclick = () => {
                    const bookId = btn.getAttribute('data-book-id');
                    if (!bookId) return;
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = async () => {
                        const file = input.files && input.files[0];
                        if (!file) return;
                        try {
                            const ok = await libSetBookCover(bookId, file);
                            if (ok) {
                                state.allBooks = libSortBooksForLibrary((libLoadIndex().books || []));
                                await applyFilter(false);
                            }
                        } catch (err) {
                            console.error(err);
                            showNotification('Đổi ảnh bìa thất bại.');
                        }
                    };
                    input.click();
                };
            });
        };

        const renderVisible = () => {
            const books = state.filteredBooks.slice(0, state.visibleCount);
            const shownCount = Math.min(state.visibleCount, state.filteredBooks.length);
            const remainingCount = Math.max(0, state.filteredBooks.length - shownCount);
            const hasMore = remainingCount > 0;
            totalEl.textContent = `Tổng ${state.allBooks.length} truyện trong thư viện`;
            metaEl.textContent = state.filteredBooks.length === state.allBooks.length
                ? `Hiển thị ${shownCount}/${state.filteredBooks.length} truyện`
                : `Tìm thấy ${state.filteredBooks.length}/${state.allBooks.length} truyện · đang hiển thị ${shownCount}`;
            grid.innerHTML = books.length
                ? books.map(renderBookCard).join('')
                : '<div class="tm-library-empty">Không có truyện phù hợp.</div>';
            loadMoreBtn.hidden = !hasMore;
            if (loadHintEl) {
                loadHintEl.hidden = !hasMore;
                loadHintEl.textContent = hasMore ? `Còn ${remainingCount} truyện, cuộn xuống hoặc bấm Tải thêm` : '';
            }
            bindCardActions();
            libTranslateLibraryTitles(wrapper, books);
            libUpdateLibraryProgress(wrapper, books);
        };

        const applyFilter = async (resetOffset = true) => {
            const token = ++state.renderToken;
            const query = String(searchInput.value || '').trim();
            const scopes = getScopes();
            if (resetOffset) state.visibleCount = LIB_LIST_PAGE_SIZE;
            metaEl.textContent = query ? 'Đang tìm...' : '';
            const matched = [];
            for (const book of state.allBooks) {
                if (token !== state.renderToken) return;
                if (await libBookMatchesSearch(book, query, scopes)) matched.push(book);
            }
            if (token !== state.renderToken) return;
            state.filteredBooks = matched;
            renderVisible();
        };

        wrapper.querySelector('#tm-lib-list-close').addEventListener('click', close);
        menuBtn?.addEventListener('click', (event) => {
            event.stopPropagation();
            closeFilter();
            menuEl?.classList.toggle('open');
        });
        menuEl?.addEventListener('click', event => event.stopPropagation());
        filterBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            closeMenu();
            filterPop.classList.toggle('open');
        });
        filterPop.addEventListener('click', event => event.stopPropagation());
        wrapper.addEventListener('click', event => {
            if (!event.target.closest?.('#tm-lib-menu') && !event.target.closest?.('#tm-lib-menu-btn')) {
                closeMenu();
            }
            if (!event.target.closest?.('#tm-lib-filter-pop') && !event.target.closest?.('#tm-lib-filter-btn')) {
                closeFilter();
            }
        });
        searchInput.addEventListener('input', () => {
            clearTimeout(state.searchTimer);
            state.searchTimer = setTimeout(() => applyFilter(true), 220);
        });
        filterPop.querySelectorAll('input').forEach(input => input.addEventListener('change', () => applyFilter(true)));
        scrollEl.addEventListener('scroll', () => {
            const nearBottom = scrollEl.scrollTop + scrollEl.clientHeight >= scrollEl.scrollHeight - 420;
            if (!nearBottom || state.visibleCount >= state.filteredBooks.length) return;
            state.visibleCount += LIB_LIST_PAGE_SIZE;
            renderVisible();
        }, { passive: true });
        loadMoreBtn.addEventListener('click', () => {
            state.visibleCount += LIB_LIST_PAGE_SIZE;
            renderVisible();
        });
        wrapper.querySelector('#tm-lib-import-open').addEventListener('click', () => {
            closeMenu();
            close();
            openLibraryImportModal();
        });
        wrapper.querySelector('#tm-lib-backup').addEventListener('click', async () => {
            closeMenu();
            try {
                await libRunLibraryBackup({ silent: false, statusEl: backupStatusEl });
            } catch (err) {
                if (err?.name !== 'AbortError') {
                    console.error(err);
                    showNotification('Sao lưu thất bại.');
                }
            }
        });
        wrapper.querySelector('#tm-lib-restore').addEventListener('click', async () => {
            closeMenu();
            try {
                await libRunLibraryRestore({ statusEl: backupStatusEl });
                state.allBooks = libSortBooksForLibrary((libLoadIndex().books || []));
                await applyFilter(true);
            } catch (err) {
                if (err?.name !== 'AbortError') {
                    console.error(err);
                    showNotification('Khôi phục thất bại.');
                }
            }
        });
        wrapper.querySelector('#tm-lib-clear-cache').addEventListener('click', async () => {
            closeMenu();
            showLoading('Đang tính dung lượng cache...');
            let sizeText = '0 B';
            try {
                const bytes = await libGetTranslatedCacheSizeBytes();
                sizeText = libFormatBytes(bytes);
            } catch (err) {
                console.error(err);
            } finally {
                removeLoading();
            }
            if (!confirm(`Xóa toàn bộ cache dịch? (Dung lượng: ${sizeText})`)) return;
            showLoading('Đang xóa cache...');
            try {
                await libClearTranslatedContent();
                state.allBooks = libSortBooksForLibrary((libLoadIndex().books || []));
                await applyFilter(false);
                showNotification('Đã xóa cache dịch.');
            } catch (err) {
                console.error(err);
                showNotification('Xóa cache thất bại.');
            } finally {
                removeLoading();
            }
        });

        libCheckLegacyDataExists().then(hasLegacy => {
            if (!hasLegacy) return;
            const slot = wrapper.querySelector('#tm-lib-migration-slot');
            if (!slot) return;
            slot.innerHTML = `
                <div style="padding:10px;margin-bottom:12px;background:#fff3cd;border:1px solid #ffc107;border-radius:8px;font-size:13px;color:#664d03;">
                    <div style="margin-bottom:8px;"><b>Phát hiện dữ liệu cũ</b> ở domain này. Chuyển sang lưu trữ toàn cục để đọc ở mọi domain.</div>
                    <button class="tm-btn tm-btn-primary" id="tm-lib-migrate-btn">Chuyển đổi</button>
                </div>
            `;
            slot.querySelector('#tm-lib-migrate-btn').addEventListener('click', async () => {
                const btn = slot.querySelector('#tm-lib-migrate-btn');
                btn.disabled = true;
                btn.textContent = 'Đang chuyển đổi...';
                try {
                    const result = await libMigrateLegacyData();
                    slot.textContent = `Chuyển đổi thành công: ${result.chapters} chương, ${result.content} nội dung.`;
                    state.allBooks = libSortBooksForLibrary((libLoadIndex().books || []));
                    await applyFilter(true);
                } catch (err) {
                    console.error(err);
                    btn.disabled = false;
                    btn.textContent = 'Thử lại';
                    showNotification('Chuyển đổi thất bại.');
                }
            });
        }).catch(() => { });

        const status = libGetBackupStatus();
        libSetBackupStatusDisplay(
            backupStatusEl,
            libDescribeBackupStatusShort(status),
            status.message
                ? `${status.message}${status.lastCompletedAt ? ` · ${libFormatRelativeTime(status.lastCompletedAt)}` : ''}`
                : libFormatRelativeTime(status.lastCompletedAt)
        );
        applyFilter(true);
        libMaybeRunBackgroundBackup(backupStatusEl);
    }

    /* ================== READER UI (NEW) ================== */
    let libReaderState = null;
    let libReaderUI = null;
    let libReaderGlobalEventsBound = false;
    let libReaderTtsState = null;

    async function libGetChaptersByBook(bookId) {
        let chapters = libLoadChaptersForBook(bookId);
        if (chapters.length > 0) {
            return chapters.sort((a, b) => (a.order || 0) - (b.order || 0));
        }


        try {
            const hasLegacy = await libCheckLegacyDataExists();
            if (hasLegacy) {
                console.log('[TM-Translate] Chapters trống trong GM, đang tự động chuyển từ IndexedDB cũ...');
                await libMigrateLegacyData();
                chapters = libLoadChaptersForBook(bookId);
                if (chapters.length > 0) {
                    console.log('[TM-Translate] Chuyển đổi thành công!', chapters.length, 'chương');
                }
            }
        } catch (e) {
            console.error('[TM-Translate] Auto-migrate failed:', e);
        }

        return chapters.sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    function libFindBookInIndex(bookId) {
        const index = libLoadIndex();
        return (index.books || []).find(b => b.bookId === bookId) || null;
    }

    function libUpdateBookLastRead(bookId, chapterId, scrollRatio, chapterOrder) {
        const index = libLoadIndex();
        const book = (index.books || []).find(b => b.bookId === bookId);
        if (!book) return;
        book.lastReadChapterId = chapterId;
        if (typeof chapterOrder === 'number' && !Number.isNaN(chapterOrder)) {
            book.lastReadOrder = chapterOrder;
        }
        if (typeof scrollRatio === 'number' && !Number.isNaN(scrollRatio)) {
            book.lastReadScrollRatio = Math.max(0, Math.min(1, scrollRatio));
        }
        book.lastReadAt = Date.now();
        book.updatedAt = Date.now();
        libSaveIndex(index);
        if (libGetBackupStatus().state !== 'dirty') {
            libSetBackupStatus({ state: 'dirty', message: 'Tiến độ đọc có thay đổi chưa sao lưu.' });
        }
    }

    function libReaderEnsureUI() {
        const existing = document.getElementById('tm-reader-overlay');
        if (existing && libReaderUI) return libReaderUI;
        if (existing) existing.remove();

        const root = document.createElement('div');
        root.id = 'tm-reader-overlay';
        root.className = 'tm-reader-overlay';
        root.innerHTML = `
            <div class="tm-reader-header">
                <div class="tm-reader-title">
                    <div id="tm-reader-book-title" class="tm-reader-book"></div>
                    <div id="tm-reader-chapter-sub" class="tm-reader-chapter"></div>
                </div>
                <div class="tm-reader-actions">
                    <button id="tm-reader-toc-btn" class="tm-btn">Mục lục</button>
                    <button id="tm-reader-raw-btn" class="tm-btn">RAW</button>
                    <button id="tm-reader-trans-btn" class="tm-btn">DỊCH</button>
                    <button id="tm-reader-settings" class="tm-btn">Cài đặt</button>
                    <button id="tm-reader-tts-settings" class="tm-btn">TTS</button>
                    <button id="tm-reader-fullscreen" class="tm-btn">Fullscreen</button>
                    <button id="tm-reader-close" class="tm-btn tm-reader-close-btn">Thoát</button>
                </div>
            </div>
            <div class="tm-reader-body">
                <div class="tm-reader-viewport">
                    <div id="tm-reader-mini-head" class="tm-reader-mini-head" aria-hidden="true" hidden>
                        <div id="tm-reader-mini-title" class="tm-reader-mini-title"></div>
                    </div>
                    <main class="tm-reader-content">
                        <h2 id="tm-reader-chapter-title"></h2>
                        <div id="tm-reader-text" class="tm-reader-text"></div>
                    </main>
                    <div id="tm-reader-mini-foot" class="tm-reader-mini-foot" aria-hidden="true" hidden>
                        <div id="tm-reader-mini-chapter" class="tm-reader-mini-item"></div>
                        <div class="tm-reader-mini-right">
                            <div id="tm-reader-mini-progress" class="tm-reader-mini-item"></div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="tm-reader-footer">
                <button id="tm-reader-prev" class="tm-btn">← Chương trước</button>
                <div id="tm-reader-progress" class="tm-reader-progress"></div>
                <button id="tm-reader-next" class="tm-btn">Chương sau →</button>
            </div>
            <div id="tm-reader-backdrop" class="tm-reader-backdrop" hidden></div>
            <aside id="tm-reader-toc" class="tm-reader-toc-drawer" aria-hidden="true">
                <div class="tm-reader-drawer-head">
                    <h3>Mục lục</h3>
                    <button id="tm-reader-toc-close" class="tm-btn">Đóng</button>
                </div>
                <div id="tm-reader-toc-list" class="tm-reader-toc-list"></div>
            </aside>
        `;
        document.body.appendChild(root);
        removeFloatingButtons();

        libReaderUI = {
            root,
            bookTitle: root.querySelector('#tm-reader-book-title'),
            chapterSub: root.querySelector('#tm-reader-chapter-sub'),
            chapterTitle: root.querySelector('#tm-reader-chapter-title'),
            contentWrap: root.querySelector('.tm-reader-content'),
            content: root.querySelector('#tm-reader-text'),
            tocDrawer: root.querySelector('#tm-reader-toc'),
            toc: root.querySelector('#tm-reader-toc-list'),
            tocBackdrop: root.querySelector('#tm-reader-backdrop'),
            btnTocClose: root.querySelector('#tm-reader-toc-close'),
            progress: root.querySelector('#tm-reader-progress'),
            miniHead: root.querySelector('#tm-reader-mini-head'),
            miniFoot: root.querySelector('#tm-reader-mini-foot'),
            miniTitle: root.querySelector('#tm-reader-mini-title'),
            miniChapter: root.querySelector('#tm-reader-mini-chapter'),
            miniProgress: root.querySelector('#tm-reader-mini-progress'),
            btnPrev: root.querySelector('#tm-reader-prev'),
            btnNext: root.querySelector('#tm-reader-next'),
            btnRaw: root.querySelector('#tm-reader-raw-btn'),
            btnTrans: root.querySelector('#tm-reader-trans-btn'),
            btnFullscreen: root.querySelector('#tm-reader-fullscreen'),
            btnSettings: root.querySelector('#tm-reader-settings'),
            btnTtsSettings: root.querySelector('#tm-reader-tts-settings'),
            btnToc: root.querySelector('#tm-reader-toc-btn'),
            btnClose: root.querySelector('#tm-reader-close')
        };

        libReaderUI.btnClose.addEventListener('click', libReaderClose);
        libReaderUI.btnPrev.addEventListener('click', () => libReaderGo(-1));
        libReaderUI.btnNext.addEventListener('click', () => libReaderGo(1));
        libReaderUI.btnToc.addEventListener('click', () => {
            libReaderSetTocOpen(!libReaderUI.tocDrawer.classList.contains('open'));
        });
        libReaderUI.btnTocClose.addEventListener('click', () => libReaderSetTocOpen(false));
        libReaderUI.tocBackdrop.addEventListener('click', () => libReaderSetTocOpen(false));
        libReaderUI.btnRaw.addEventListener('click', () => libReaderSetMode('raw'));
        libReaderUI.btnTrans.addEventListener('click', () => libReaderSetMode('trans'));
        libReaderUI.btnFullscreen.addEventListener('click', () => libReaderToggleFullscreen());
        libReaderUI.btnSettings.addEventListener('click', () => openSettingsUI('library'));
        libReaderUI.btnTtsSettings.addEventListener('click', () => openSettingsUI('tts'));
        if (libReaderUI.contentWrap) {
            libReaderUI.contentWrap.addEventListener('pointerdown', libReaderNameTapStart, { passive: true });
            libReaderUI.contentWrap.addEventListener('pointermove', libReaderNameTapMove, { passive: true });
            libReaderUI.contentWrap.addEventListener('pointerup', libReaderNameTapEnd, { passive: true });
            libReaderUI.contentWrap.addEventListener('pointercancel', libReaderNameTapEnd, { passive: true });
            libReaderUI.contentWrap.addEventListener('touchstart', libReaderNameTapStart, { passive: true });
            libReaderUI.contentWrap.addEventListener('touchmove', libReaderNameTapMove, { passive: true });
            libReaderUI.contentWrap.addEventListener('touchend', libReaderNameTapEnd, { passive: true });
            libReaderUI.contentWrap.addEventListener('touchcancel', libReaderNameTapEnd, { passive: true });
            libReaderUI.contentWrap.addEventListener('touchstart', libReaderBoundaryTouchStart, { passive: true });
            libReaderUI.contentWrap.addEventListener('touchmove', libReaderBoundaryTouchMove, { passive: true });
            libReaderUI.contentWrap.addEventListener('touchend', libReaderBoundaryTouchEnd, { passive: true });
            libReaderUI.contentWrap.addEventListener('touchcancel', libReaderBoundaryTouchEnd, { passive: true });
            libReaderUI.contentWrap.addEventListener('click', (e) => {
                const nameSpan = e.target.closest('.tm-name');
                if (!nameSpan) return;
                if (libReaderShouldIgnoreNameClick(nameSpan)) {
                    return;
                }
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                const orig = nameSpan.dataset.orig || '';
                const text = nameSpan.textContent || '';
                showEditModal(orig, text, { readerTheme: true });
                if (libReaderState) libReaderState.nameTapGuard = null;
                return;
            });
            libReaderUI.contentWrap.addEventListener('click', (e) => {
                libReaderHandleFullscreenContentTap(e);
            });
            libReaderUI.contentWrap.addEventListener('contextmenu', (e) => {
                if (!libReaderUI.contentWrap.contains(e.target)) return;
                const sel = window.getSelection();
                if (sel && sel.toString().trim()) {
                    e.preventDefault();
                }
            });
        }
        if (libReaderUI.contentWrap) {
            libReaderUI.contentWrap.addEventListener('scroll', libReaderHandleScroll);
            libReaderUI.contentWrap.addEventListener('wheel', libReaderHandleWheel, { passive: true });
        }
        if (!libReaderGlobalEventsBound) {
            document.addEventListener('fullscreenchange', libReaderRefreshFullscreenMode);
            document.addEventListener('webkitfullscreenchange', libReaderRefreshFullscreenMode);
            document.addEventListener('keydown', libReaderHandleKeydown, true);
            document.addEventListener('visibilitychange', libReaderHandleVisibilityChange, true);
            window.addEventListener('pagehide', libReaderSaveProgressNow, true);
            window.addEventListener('beforeunload', libReaderSaveProgressNow, true);
            libReaderGlobalEventsBound = true;
        }

        return libReaderUI;
    }

    function libReaderSetTocOpen(open) {
        if (!libReaderUI?.tocDrawer) return;
        const shouldOpen = !!open;
        libReaderUI.tocDrawer.classList.toggle('open', shouldOpen);
        libReaderUI.tocDrawer.setAttribute('aria-hidden', shouldOpen ? 'false' : 'true');
        if (libReaderUI.tocBackdrop) {
            libReaderUI.tocBackdrop.hidden = !shouldOpen;
            libReaderUI.tocBackdrop.classList.toggle('open', shouldOpen);
        }
    }

    function libReaderSelectionText() {
        const sel = window.getSelection();
        return sel ? String(sel.toString() || '').trim() : '';
    }

    function libReaderEventPoint(event) {
        const point = event?.changedTouches?.[0] || event?.touches?.[0] || event;
        return {
            x: Number(point?.clientX) || 0,
            y: Number(point?.clientY) || 0
        };
    }

    function libReaderNameTapStart(event) {
        const nameSpan = event?.target?.closest?.('.tm-name');
        if (!nameSpan || !libReaderState) return;
        const point = libReaderEventPoint(event);
        libReaderState.nameTapGuard = {
            target: nameSpan,
            x: point.x,
            y: point.y,
            startedAt: Date.now(),
            moved: false
        };
    }

    function libReaderNameTapMove(event) {
        const guard = libReaderState?.nameTapGuard;
        if (!guard) return;
        const point = libReaderEventPoint(event);
        if (Math.hypot(point.x - guard.x, point.y - guard.y) > 10) {
            guard.moved = true;
        }
    }

    function libReaderNameTapEnd(event) {
        const guard = libReaderState?.nameTapGuard;
        if (!guard) return;
        libReaderNameTapMove(event);
        const heldMs = Date.now() - guard.startedAt;
        if (guard.moved || heldMs > 320 || libReaderSelectionText()) {
            libReaderState.ignoreNameClickUntil = Date.now() + 650;
        }
        scheduleSelectionEditButtonUpdate(120);
    }

    function libReaderShouldIgnoreNameClick(nameSpan) {
        if (!libReaderState) return false;
        if (libReaderSelectionText()) return true;
        if (Date.now() < (libReaderState.ignoreNameClickUntil || 0)) return true;
        const guard = libReaderState.nameTapGuard;
        if (guard && guard.target === nameSpan) {
            const heldMs = Date.now() - guard.startedAt;
            if (guard.moved || heldMs > 320) return true;
        }
        return false;
    }

    function libReaderFullscreenElement() {
        return document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement || null;
    }

    function libReaderIsFullscreenActive() {
        return !!libReaderFullscreenElement() || !!(libReaderState && libReaderState.fullscreenFallback);
    }

    function libReaderClearFullscreenUiTimer() {
        if (!libReaderState?.fullscreenUiTimer) return;
        clearTimeout(libReaderState.fullscreenUiTimer);
        libReaderState.fullscreenUiTimer = null;
    }

    function libReaderSetFullscreenUiVisible(visible, { autoHideMs = 0 } = {}) {
        if (!libReaderUI?.root) return;
        libReaderClearFullscreenUiTimer();
        const isVisible = !!visible;
        libReaderUI.root.classList.toggle('tm-reader-fullscreen-ui-visible', isVisible);
        libReaderUpdateMiniInfo();
        if (isVisible && autoHideMs > 0 && libReaderState) {
            libReaderState.fullscreenUiTimer = setTimeout(() => {
                if (!libReaderIsFullscreenActive()) return;
                libReaderUI?.root?.classList.remove('tm-reader-fullscreen-ui-visible');
                libReaderUpdateMiniInfo();
                if (libReaderState) libReaderState.fullscreenUiTimer = null;
            }, autoHideMs);
        }
    }

    function libReaderUpdateMiniInfo() {
        if (!libReaderUI || !libReaderState) return;
        const total = libReaderState.chapters?.length || 0;
        const index = Math.max(0, libReaderState.currentIndex || 0);
        const chapter = libReaderState.chapters?.[index];
        const ratio = Math.max(0, Math.min(1, Number(libReaderState.lastScrollRatio || 0)));
        const bookPercent = total > 0 ? Math.max(0, Math.min(100, ((index + ratio) / total) * 100)) : 0;
        const chapterText = total > 0 ? `Chương ${index + 1} / ${total}` : 'Chưa có chương';
        const percentText = `${bookPercent.toFixed(1)}%`;

        if (libReaderUI.progress) libReaderUI.progress.textContent = `${chapterText} · ${percentText}`;
        if (libReaderUI.miniTitle) libReaderUI.miniTitle.textContent = libReaderUI.chapterTitle?.textContent || chapter?.title || `Chương ${index + 1}`;
        if (libReaderUI.miniChapter) libReaderUI.miniChapter.textContent = chapterText;
        if (libReaderUI.miniProgress) libReaderUI.miniProgress.textContent = percentText;

        const showMini = libReaderIsFullscreenActive();
        libReaderUI.root.classList.toggle('tm-reader-mini-visible', showMini);
        if (libReaderUI.miniHead) libReaderUI.miniHead.hidden = !showMini;
        if (libReaderUI.miniFoot) libReaderUI.miniFoot.hidden = !showMini;
    }

    function libReaderTtsFormatDuration(ms) {
        const total = Math.max(0, Math.ceil((Number(ms) || 0) / 1000));
        const h = Math.floor(total / 3600);
        const m = Math.floor((total % 3600) / 60);
        const s = total % 60;
        if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        return `${m}:${String(s).padStart(2, '0')}`;
    }

    function libReaderTtsEffectiveMaxChars(settings) {
        const provider = String(settings?.provider || 'browser');
        const caps = { tiktok: 200, google: 200, gemini: 600, bing: 600, zalo: 500 };
        const configured = Number(settings?.maxChars) > 0 ? Number(settings.maxChars) : TTS_DEFAULT_SETTINGS.maxChars;
        return Math.max(80, Math.min(configured, caps[provider] || configured || 260));
    }

    function libReaderTtsGetParagraphs(textRoot) {
        if (!textRoot) return [];
        const paragraphs = Array.from(textRoot.children || [])
            .filter(el => (el.tagName || '').toLowerCase() === 'p');
        return paragraphs.length ? paragraphs : [textRoot];
    }

    function libReaderTtsGetTextRootText(textRoot) {
        return libReaderTtsGetParagraphs(textRoot)
            .map(el => String(el.textContent || ''))
            .join('\n');
    }

    function libReaderTtsSplitTextWithOffsets(text, startOffset, maxChars) {
        const source = String(text || '');
        const chunks = [];
        const limit = Math.max(80, Number(maxChars) || 260);
        let pos = Math.max(0, Math.min(source.length, Number(startOffset) || 0));
        const marks = ['\n', '。', '！', '？', '；', ';', '.', '!', '?', '，', ',', '、', ':', '：'];

        while (pos < source.length) {
            while (pos < source.length && /\s/u.test(source[pos])) pos += 1;
            if (pos >= source.length) break;

            let end = Math.min(source.length, pos + limit);
            if (end < source.length) {
                const slice = source.slice(pos, end);
                let cut = -1;
                for (const mark of marks) {
                    const idx = slice.lastIndexOf(mark);
                    if (idx > 0 && idx > cut) cut = idx + mark.length;
                }
                if (cut > 0) {
                    end = pos + cut;
                } else {
                    const space = slice.lastIndexOf(' ');
                    if (space > 0) end = pos + space + 1;
                }
            }
            while (end > pos && /\s/u.test(source[end - 1])) end -= 1;
            if (end <= pos) end = Math.min(source.length, pos + limit);

            const chunkText = source.slice(pos, end).trim();
            if (chunkText) chunks.push({ text: chunkText, start: pos, end, type: 'body' });
            pos = Math.max(end, pos + 1);
        }
        return chunks;
    }

    function libReaderTtsFindTextBoundary(root, offset) {
        if (!root) return null;
        const target = Math.max(0, Number(offset) || 0);
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        let remaining = target;
        let last = null;
        let node = walker.nextNode();
        while (node) {
            const len = String(node.nodeValue || '').length;
            last = node;
            if (remaining <= len) return { node, offset: remaining };
            remaining -= len;
            node = walker.nextNode();
        }
        return last ? { node: last, offset: String(last.nodeValue || '').length } : null;
    }

    function libReaderTtsWrapElementRange(root, start, end, segmentId) {
        if (!root || end <= start) return;
        const startPoint = libReaderTtsFindTextBoundary(root, start);
        const endPoint = libReaderTtsFindTextBoundary(root, end);
        if (!startPoint || !endPoint) return;
        try {
            const range = document.createRange();
            range.setStart(startPoint.node, startPoint.offset);
            range.setEnd(endPoint.node, endPoint.offset);
            if (range.collapsed) return;
            const span = document.createElement('span');
            span.className = 'tm-reader-tts-segment';
            span.dataset.ttsSegment = segmentId;
            span.appendChild(range.extractContents());
            range.insertNode(span);
        } catch (err) {
            console.warn('[tm-translate] Không highlight được đoạn TTS:', err);
        }
    }

    function libReaderTtsClearHighlights() {
        document.querySelectorAll('.tm-reader-tts-segment').forEach(span => {
            const parent = span.parentNode;
            if (!parent) return;
            while (span.firstChild) parent.insertBefore(span.firstChild, span);
            span.remove();
            try { parent.normalize(); } catch (err) { /* ignore */ }
        });
    }

    function libReaderTtsApplyHighlights(textRoot, segments) {
        libReaderTtsClearHighlights();
        const paragraphs = libReaderTtsGetParagraphs(textRoot);
        if (!paragraphs.length) return;
        const ranges = [];
        let cursor = 0;
        paragraphs.forEach((paragraph, paragraphIndex) => {
            const length = String(paragraph.textContent || '').length;
            for (const segment of segments || []) {
                if (!segment.id || segment.type === 'title') continue;
                const start = Math.max(segment.start - cursor, 0);
                const end = Math.min(segment.end - cursor, length);
                if (end > start) ranges.push({ paragraphIndex, start, end, id: segment.id });
            }
            cursor += length + 1;
        });
        ranges.sort((a, b) => (b.paragraphIndex - a.paragraphIndex) || (b.start - a.start));
        for (const item of ranges) {
            const paragraph = libReaderTtsGetParagraphs(textRoot)[item.paragraphIndex];
            if (paragraph) libReaderTtsWrapElementRange(paragraph, item.start, item.end, item.id);
        }
    }

    function libReaderTtsSetActiveHighlight(segment) {
        document.querySelectorAll('.tm-reader-tts-segment').forEach(el => {
            el.classList.toggle('tm-reader-tts-active', !!segment?.id && el.dataset.ttsSegment === segment.id);
        });
        if (!segment?.id || !libReaderTtsState?.settings?.autoScroll) return;
        const active = Array.from(document.querySelectorAll('.tm-reader-tts-segment'))
            .find(el => el.dataset.ttsSegment === segment.id);
        if (active && typeof active.scrollIntoView === 'function') {
            active.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
        }
    }

    function libReaderTtsFindTextRootForChapter(index) {
        if (!libReaderUI?.content || !libReaderState?.chapters?.[index]) return null;
        const chapter = libReaderState.chapters[index];
        const blocks = Array.from(libReaderUI.content.querySelectorAll('.tm-reader-block[data-chapter-id]'));
        const block = blocks.find(el => el.dataset.chapterId === chapter.chapterId);
        if (block) return block.querySelector('.tm-reader-block-text');
        return libReaderUI.content.querySelector('.tm-reader-block-text') || libReaderUI.content;
    }

    function libReaderTtsEnsurePlayer() {
        if (!libReaderUI?.root) return null;
        let player = libReaderUI.root.querySelector('#tm-reader-tts-player');
        if (player) return player;
        player = document.createElement('div');
        player.id = 'tm-reader-tts-player';
        player.className = 'tm-reader-tts-player';
        player.innerHTML = `
            <div class="tm-reader-tts-disc" aria-hidden="true"></div>
            <div class="tm-reader-tts-main">
                <div id="tm-reader-tts-title" class="tm-reader-tts-title">TTS</div>
                <div class="tm-reader-tts-meta">
                    <div id="tm-reader-tts-status" class="tm-reader-tts-status">Đang chuẩn bị...</div>
                    <div id="tm-reader-tts-time" class="tm-reader-tts-time"></div>
                </div>
                <div class="tm-reader-tts-controls">
                    <button id="tm-reader-tts-toggle" class="tm-btn" type="button">Tạm dừng</button>
                    <button id="tm-reader-tts-next" class="tm-btn" type="button">Tiếp</button>
                    <button id="tm-reader-tts-stop" class="tm-btn" type="button">Dừng</button>
                </div>
            </div>
        `;
        player.querySelector('#tm-reader-tts-toggle')?.addEventListener('click', libReaderTtsTogglePause);
        player.querySelector('#tm-reader-tts-next')?.addEventListener('click', () => libReaderTtsSkipSegment());
        player.querySelector('#tm-reader-tts-stop')?.addEventListener('click', () => libReaderTtsStop({ notify: 'Đã dừng TTS.' }));
        libReaderUI.root.appendChild(player);
        return player;
    }

    function libReaderTtsUpdatePlayer() {
        const state = libReaderTtsState;
        const player = libReaderTtsEnsurePlayer();
        if (!player) return;
        const active = !!state?.active;
        const paused = !!state?.paused;
        player.classList.toggle('open', active);
        player.classList.toggle('playing', active && !paused);
        player.classList.toggle('paused', active && paused);
        if (!active) return;

        const chapterText = state.totalChapters
            ? `Chương ${state.chapterIndex + 1}/${state.totalChapters}`
            : 'TTS';
        const segmentText = state.segments?.length
            ? `Đoạn ${Math.min(state.segmentIndex + 1, state.segments.length)}/${state.segments.length}`
            : 'Đang tải';
        const titleEl = player.querySelector('#tm-reader-tts-title');
        const statusEl = player.querySelector('#tm-reader-tts-status');
        const timeEl = player.querySelector('#tm-reader-tts-time');
        const toggleBtn = player.querySelector('#tm-reader-tts-toggle');
        if (titleEl) titleEl.textContent = state.chapterTitle || chapterText;
        if (statusEl) statusEl.textContent = state.status || `${chapterText} · ${segmentText}`;
        if (timeEl) {
            timeEl.textContent = state.sleepEndsAt
                ? `Ngủ ${libReaderTtsFormatDuration(state.sleepEndsAt - Date.now())}`
                : segmentText;
        }
        if (toggleBtn) toggleBtn.textContent = paused ? 'Phát' : 'Tạm dừng';
    }

    function libReaderTtsSetStatus(status) {
        if (!libReaderTtsState) return;
        libReaderTtsState.status = status;
        libReaderTtsUpdatePlayer();
    }

    function libReaderTtsCanPrefetch(state = libReaderTtsState) {
        return !!(
            state?.active &&
            !state.paused &&
            state.settings?.prefetchEnabled &&
            String(state.settings.provider || 'browser') !== 'browser' &&
            state.core &&
            typeof state.core.prefetchText === 'function'
        );
    }

    function libReaderTtsSchedulePrefetch() {
        const state = libReaderTtsState;
        if (!libReaderTtsCanPrefetch(state)) return;
        const count = tmTtsClampInt(state.settings.prefetchCount, TTS_LIMITS.prefetchCount[0], TTS_LIMITS.prefetchCount[1], 0);
        if (count <= 0) return;
        const jobId = (state.prefetchJobId || 0) + 1;
        state.prefetchJobId = jobId;
        setTimeout(() => {
            if (!libReaderTtsCanPrefetch(state) || libReaderTtsState !== state || state.prefetchJobId !== jobId) return;
            (async () => {
                const coreSettings = libReaderTtsBuildCoreSettings(state.settings);
                let fetched = 0;
                let index = state.segmentIndex + 1;
                while (fetched < count && index < state.segments.length) {
                    if (!libReaderTtsCanPrefetch(state) || libReaderTtsState !== state || state.prefetchJobId !== jobId) return;
                    const segment = state.segments[index];
                    index += 1;
                    if (!segment?.text) continue;
                    const key = `${state.chapterIndex}:${index - 1}:${segment.text}`;
                    if (state.prefetchedSegments?.has(key)) continue;
                    state.prefetchedSegments?.add(key);
                    try {
                        await state.core.prefetchText(segment.text, {
                            provider: state.settings.provider || 'browser',
                            settings: coreSettings,
                            maxChars: state.maxChars,
                            lang: /[\u4e00-\u9fff]/.test(segment.text) ? 'zh-CN' : 'vi-VN',
                            title: state.chapterTitle || 'TM Translate',
                            artist: state.bookTitle || 'TM Translate'
                        });
                        fetched += 1;
                    } catch (err) {
                        state.prefetchedSegments?.delete(key);
                        return;
                    }
                    await new Promise(resolve => setTimeout(resolve, 220));
                }
            })();
        }, 120);
    }

    function libReaderTtsClearTimers() {
        if (!libReaderTtsState) return;
        if (libReaderTtsState.pollTimer) clearInterval(libReaderTtsState.pollTimer);
        if (libReaderTtsState.sleepTimer) clearTimeout(libReaderTtsState.sleepTimer);
        if (libReaderTtsState.sleepFadeTimer) clearTimeout(libReaderTtsState.sleepFadeTimer);
        libReaderTtsState.pollTimer = 0;
        libReaderTtsState.sleepTimer = 0;
        libReaderTtsState.sleepFadeTimer = 0;
    }

    function libReaderTtsStop({ notify = '', silent = false } = {}) {
        const state = libReaderTtsState;
        if (state) state.prefetchJobId = (state.prefetchJobId || 0) + 1;
        if (state?.core && typeof state.core.stop === 'function') {
            try { state.core.stop(); } catch (err) { /* ignore */ }
        }
        libReaderTtsClearTimers();
        libReaderTtsState = null;
        libReaderTtsClearHighlights();
        const player = libReaderUI?.root?.querySelector('#tm-reader-tts-player');
        if (player) {
            player.classList.remove('open', 'playing', 'paused');
        }
        if (notify && !silent) showNotification(notify, 2600);
    }

    function libReaderTtsStopBySleepTimer() {
        libReaderTtsStop({ notify: 'Hẹn giờ ngủ đã dừng TTS.' });
    }

    function libReaderTtsSleepFadeMs(state = libReaderTtsState) {
        const remaining = state?.sleepEndsAt ? Math.max(0, state.sleepEndsAt - Date.now()) : TTS_SLEEP_FADE_OUT_MS;
        return Math.min(TTS_SLEEP_FADE_OUT_MS, Math.max(1000, remaining || TTS_SLEEP_FADE_OUT_MS));
    }

    function libReaderTtsBeginSleepFade() {
        const state = libReaderTtsState;
        if (!state?.active || state.sleepFadeStarted) return;
        state.sleepFadeStarted = true;
        const fadeMs = libReaderTtsSleepFadeMs(state);
        libReaderTtsSetStatus(`Hẹn giờ ngủ · đang giảm âm lượng ${libReaderTtsFormatDuration(fadeMs)}`);
        try {
            if (state.core && typeof state.core.fadeOutAndStop === 'function') {
                state.core.fadeOutAndStop(fadeMs);
            }
        } catch (err) {
            /* ignore */
        }
        if (state.sleepFadeTimer) clearTimeout(state.sleepFadeTimer);
        state.sleepFadeTimer = setTimeout(libReaderTtsStopBySleepTimer, fadeMs + 350);
    }

    function libReaderTtsShouldContinueChapters(settings) {
        return !!(settings?.autoNext && settings?.autoStartOnNextChapter);
    }

    function libReaderTtsBuildCoreSettings(settings) {
        return normalizeTtsSettings({
            ...settings,
            sleepTimerEnabled: false
        });
    }

    function libReaderTtsSpeakAnnouncementAndStop(message) {
        const state = libReaderTtsState;
        const text = String(message || '').trim();
        if (!state?.active || !text) {
            libReaderTtsStop({ notify: text || 'Đã dừng TTS.' });
            return;
        }
        if (state.pollTimer) clearInterval(state.pollTimer);
        if (state.sleepTimer) clearTimeout(state.sleepTimer);
        if (state.sleepFadeTimer) clearTimeout(state.sleepFadeTimer);
        state.pollTimer = 0;
        state.sleepTimer = 0;
        state.sleepFadeTimer = 0;
        state.sleepEndsAt = 0;
        state.sleepFadeStarted = false;
        state.endingAnnouncementActive = true;
        state.endingNotify = text;
        state.paused = false;
        state.segmentStartedAt = Date.now();
        state.prefetchJobId = (state.prefetchJobId || 0) + 1;
        libReaderTtsSetActiveHighlight(null);
        libReaderTtsSetStatus('Đang phát thông báo kết thúc...');

        const result = state.core.speakText(text, {
            provider: state.settings.provider || 'browser',
            settings: libReaderTtsBuildCoreSettings(state.settings),
            maxChars: state.maxChars,
            lang: 'vi-VN',
            title: 'TM Translate',
            artist: state.bookTitle || 'TM Translate'
        });
        if (!result || result.ok === false) {
            libReaderTtsStop({ notify: text });
            return;
        }
        state.pollTimer = setInterval(libReaderTtsPoll, 350);
        libReaderTtsUpdatePlayer();
    }

    async function libReaderTtsPrepareChapter(index, startOffset = 0) {
        const state = libReaderTtsState;
        if (!state?.active || !libReaderState?.chapters?.[index]) return false;
        if (libReaderState.currentIndex !== index) {
            await libReaderGoTo(index, { scrollTo: 'top', fromTts: true });
        }
        if (libReaderState.currentIndex !== index) return false;
        if (!state.active) return false;

        libReaderTtsClearHighlights();
        const chapter = libReaderState.chapters[index];
        const textRoot = libReaderTtsFindTextRootForChapter(index);
        if (!textRoot) return false;
        const bodyText = libReaderTtsGetTextRootText(textRoot);
        const maxChars = libReaderTtsEffectiveMaxChars(state.settings);
        const segments = [];
        const shouldReadTitle = !!state.settings.includeTitle && Number(startOffset || 0) <= 0;
        const title = (libReaderUI?.chapterTitle?.textContent || chapter.title || `Chương ${index + 1}`).trim();
        if (shouldReadTitle && title) {
            segments.push({ text: title, start: 0, end: 0, type: 'title', id: '' });
        }
        const bodySegments = libReaderTtsSplitTextWithOffsets(bodyText, startOffset, maxChars)
            .map((segment, segmentIndex) => ({
                ...segment,
                id: `tts-${state.runId}-${index}-${segmentIndex}`
            }));
        segments.push(...bodySegments);
        libReaderTtsApplyHighlights(textRoot, bodySegments);

        state.chapterIndex = index;
        state.chapterTitle = title || `Chương ${index + 1}`;
        state.textRoot = textRoot;
        state.segments = segments;
        state.segmentIndex = 0;
        state.prefetchedSegments = new Set();
        state.totalChapters = libReaderState.chapters.length;
        libReaderTtsSetStatus(`Đang chuẩn bị ${state.chapterTitle}...`);
        return segments.length > 0;
    }

    function libReaderTtsPlayCurrentSegment() {
        const state = libReaderTtsState;
        if (!state?.active) return;
        if (!state.segments || state.segmentIndex >= state.segments.length) {
            libReaderTtsFinishChapter();
            return;
        }
        const segment = state.segments[state.segmentIndex];
        if (!segment?.text) {
            state.segmentIndex += 1;
            libReaderTtsPlayCurrentSegment();
            return;
        }

        if (state.pollTimer) clearInterval(state.pollTimer);
        state.pollTimer = 0;
        state.paused = false;
        state.segmentStartedAt = Date.now();
        libReaderTtsSetActiveHighlight(segment);
        libReaderTtsSetStatus(`Đang tải audio · Đoạn ${state.segmentIndex + 1}/${state.segments.length}`);

        const result = state.core.speakText(segment.text, {
            provider: state.settings.provider || 'browser',
            settings: libReaderTtsBuildCoreSettings(state.settings),
            maxChars: state.maxChars,
            lang: /[\u4e00-\u9fff]/.test(segment.text) ? 'zh-CN' : 'vi-VN',
            title: state.chapterTitle || 'TM Translate',
            artist: state.bookTitle || 'TM Translate'
        });
        if (!result || result.ok === false) {
            const reason = result?.reason || 'tts failed';
            libReaderTtsStop({ notify: `Không phát TTS được: ${reason}` });
            return;
        }

        libReaderTtsSchedulePrefetch();
        state.pollTimer = setInterval(libReaderTtsPoll, 350);
        libReaderTtsUpdatePlayer();
    }

    function libReaderTtsPoll() {
        const state = libReaderTtsState;
        if (!state?.active) return;
        if (state.sleepEndsAt && Date.now() >= state.sleepEndsAt) {
            libReaderTtsStopBySleepTimer();
            return;
        }
        let coreState = null;
        try {
            coreState = state.core.getState();
        } catch (err) {
            libReaderTtsStop({ notify: 'TTS runtime bị dừng.' });
            return;
        }
        const lastError = String(coreState?.lastError || '').trim();
        if (lastError) {
            if (state.endingAnnouncementActive) {
                libReaderTtsStop({ notify: state.endingNotify || `TTS lỗi: ${lastError}` });
                return;
            }
            libReaderTtsStop({ notify: `TTS lỗi: ${lastError}` });
            return;
        }
        state.paused = !!coreState?.paused;
        const elapsed = Date.now() - (state.segmentStartedAt || Date.now());
        if (state.endingAnnouncementActive) {
            if (!coreState?.playing && elapsed > 650 && !state.paused) {
                libReaderTtsStop({ notify: state.endingNotify || 'Đã dừng TTS.' });
                return;
            }
            if (coreState?.remoteLoading || coreState?.silentKeepAliveActive) {
                libReaderTtsSetStatus('Đang tải thông báo kết thúc...');
            } else if (coreState?.paused) {
                libReaderTtsSetStatus('Tạm dừng thông báo kết thúc');
            } else {
                libReaderTtsSetStatus('Đang phát thông báo kết thúc...');
            }
            libReaderTtsUpdatePlayer();
            return;
        }
        if (!coreState?.playing && elapsed > 650 && !state.paused) {
            if (state.sleepFadeStarted) {
                libReaderTtsSetStatus('Hẹn giờ ngủ · đang giảm âm lượng');
                return;
            }
            clearInterval(state.pollTimer);
            state.pollTimer = 0;
            state.segmentIndex += 1;
            libReaderTtsPlayCurrentSegment();
            return;
        }
        if (state.sleepFadeStarted || coreState?.fadingOut) {
            libReaderTtsSetStatus(`Hẹn giờ ngủ · đang giảm âm lượng · Đoạn ${state.segmentIndex + 1}/${state.segments.length}`);
        } else if (coreState?.remoteLoading || coreState?.silentKeepAliveActive) {
            const label = coreState.silentKeepAliveActive ? 'Đang chờ audio · giữ media' : 'Đang tải audio';
            libReaderTtsSetStatus(`${label} · Đoạn ${state.segmentIndex + 1}/${state.segments.length}`);
        } else if (coreState?.playing && !coreState?.paused) {
            libReaderTtsSetStatus(`Đang phát · Đoạn ${state.segmentIndex + 1}/${state.segments.length}`);
        } else if (coreState?.paused) {
            libReaderTtsSetStatus(`Tạm dừng · Đoạn ${state.segmentIndex + 1}/${state.segments.length}`);
        } else {
            libReaderTtsSetStatus(`Đang tải audio · Đoạn ${state.segmentIndex + 1}/${state.segments.length}`);
        }
        libReaderTtsUpdatePlayer();
    }

    async function libReaderTtsFinishChapter() {
        const state = libReaderTtsState;
        if (!state?.active) return;
        const nextIndex = state.chapterIndex + 1;
        const canContinue = libReaderTtsShouldContinueChapters(state.settings)
            && nextIndex < (libReaderState?.chapters?.length || 0);
        if (!canContinue) {
            const hasNextChapter = nextIndex < (libReaderState?.chapters?.length || 0);
            const message = hasNextChapter
                ? 'Đã dừng ở cuối chương. Bật Tự qua đoạn chương và Tự đọc chương kế để tự động đọc tiếp tới hết truyện.'
                : 'Bạn đã tới cuối truyện.';
            libReaderTtsSpeakAnnouncementAndStop(message);
            return;
        }
        libReaderTtsSetStatus(`Đang chuyển sang chương ${nextIndex + 1}...`);
        try {
            const ok = await libReaderTtsPrepareChapter(nextIndex, 0);
            if (!ok) {
                libReaderTtsStop({ notify: 'Không có nội dung TTS ở chương tiếp.' });
                return;
            }
            libReaderTtsPlayCurrentSegment();
        } catch (err) {
            console.error(err);
            libReaderTtsStop({ notify: 'Không chuyển chương TTS được.' });
        }
    }

    function libReaderTtsTogglePause() {
        const state = libReaderTtsState;
        if (!state?.active) return;
        try {
            if (state.paused) {
                state.core.resume();
                state.paused = false;
                libReaderTtsSetStatus(`Đang phát · Đoạn ${state.segmentIndex + 1}/${state.segments.length}`);
            } else {
                state.core.pause();
                state.paused = true;
                libReaderTtsSetStatus(`Tạm dừng · Đoạn ${state.segmentIndex + 1}/${state.segments.length}`);
            }
        } catch (err) {
            libReaderTtsStop({ notify: 'Không điều khiển TTS được.' });
        }
        libReaderTtsUpdatePlayer();
    }

    function libReaderTtsSkipSegment() {
        const state = libReaderTtsState;
        if (!state?.active) return;
        if (state.pollTimer) clearInterval(state.pollTimer);
        state.pollTimer = 0;
        if (state.endingAnnouncementActive) {
            libReaderTtsStop({ notify: state.endingNotify || 'Đã dừng TTS.' });
            return;
        }
        state.prefetchJobId = (state.prefetchJobId || 0) + 1;
        try { state.core.stop(); } catch (err) { /* ignore */ }
        state.segmentIndex += 1;
        libReaderTtsPlayCurrentSegment();
    }

    async function libReaderTtsStartFromSelection(range = getActiveSelectionRangeForAction()) {
        const context = getSelectionReaderContext(range);
        if (!context?.chapter) return false;
        const core = getTtsCore();
        if (!core || typeof core.speakText !== 'function' || typeof core.getState !== 'function') {
            showNotification('TTS core chưa sẵn sàng.');
            return true;
        }

        const container = getSelectionContainer(range);
        const textRoot = container?.closest?.('.tm-reader-block-text, .tm-reader-text');
        let startOffset = 0;
        if (textRoot) {
            const offset = computeReaderTextRootOffset(textRoot, range.startContainer, range.startOffset);
            if (offset != null) startOffset = offset;
        }

        libReaderTtsStop({ silent: true });
        const settings = loadTtsSettings();
        const sleepMinutes = Math.max(1, Number(settings.sleepTimerMinutes) || TTS_DEFAULT_SETTINGS.sleepTimerMinutes);
        const runId = Date.now().toString(36);
        libReaderTtsState = {
            active: true,
            paused: false,
            runId,
            core,
            settings,
            maxChars: libReaderTtsEffectiveMaxChars(settings),
            bookTitle: libReaderUI?.bookTitle?.textContent || context.book?.title || 'TM Translate',
            chapterIndex: context.chapterIndex,
            totalChapters: libReaderState?.chapters?.length || 0,
            segmentIndex: 0,
            segments: [],
            status: 'Đang chuẩn bị...',
            sleepEndsAt: settings.sleepTimerEnabled ? Date.now() + (sleepMinutes * 60 * 1000) : 0,
            pollTimer: 0,
            sleepTimer: 0,
            sleepFadeTimer: 0,
            sleepFadeStarted: false,
            endingAnnouncementActive: false,
            endingNotify: '',
            prefetchJobId: 0,
            prefetchedSegments: new Set()
        };
        if (libReaderTtsState.sleepEndsAt) {
            const durationMs = sleepMinutes * 60 * 1000;
            const fadeMs = Math.min(TTS_SLEEP_FADE_OUT_MS, Math.max(1000, Math.floor(durationMs / 4)));
            libReaderTtsState.sleepTimer = setTimeout(libReaderTtsBeginSleepFade, Math.max(0, durationMs - fadeMs));
        }
        libReaderTtsEnsurePlayer();
        libReaderTtsUpdatePlayer();
        showNotification('Đang chuẩn bị phát TTS từ đoạn chọn...', 1800);

        try {
            const ok = await libReaderTtsPrepareChapter(context.chapterIndex, startOffset);
            if (!ok) {
                libReaderTtsStop({ notify: 'Không có nội dung để phát TTS.' });
                return true;
            }
            hideSelectionEditButton();
            const selection = window.getSelection();
            try { selection?.removeAllRanges?.(); } catch (err) { /* ignore */ }
            libReaderTtsPlayCurrentSegment();
        } catch (err) {
            console.error(err);
            libReaderTtsStop({ notify: 'Không khởi động TTS reader được.' });
        }
        return true;
    }

    function libReaderRefreshFullscreenMode() {
        if (!libReaderUI?.root) return;
        if (libReaderFullscreenElement()) {
            if (libReaderState) libReaderState.fullscreenFallback = false;
        }
        const isFullscreen = libReaderIsFullscreenActive();
        if (libReaderState) libReaderState.fullscreen = isFullscreen;
        libReaderUI.root.classList.toggle('tm-reader-fullscreen', isFullscreen);
        if (libReaderUI.btnFullscreen) {
            libReaderUI.btnFullscreen.textContent = isFullscreen ? 'Thoát full' : 'Fullscreen';
        }
        if (isFullscreen) {
            libReaderSetFullscreenUiVisible(true, { autoHideMs: 2200 });
        } else {
            libReaderSetFullscreenUiVisible(false);
            libReaderUpdateMiniInfo();
        }
    }

    async function libReaderExitFullscreen() {
        if (!libReaderIsFullscreenActive()) return;
        if (libReaderState) libReaderState.fullscreenFallback = false;
        const exit = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
        if (libReaderFullscreenElement() && typeof exit === 'function') {
            try { await exit.call(document); } catch (e) { /* ignore */ }
        }
        libReaderRefreshFullscreenMode();
    }

    async function libReaderToggleFullscreen() {
        if (!libReaderUI?.root) return;
        if (libReaderIsFullscreenActive()) {
            await libReaderExitFullscreen();
            return;
        }

        // Fullscreen the whole document so shadow-DOM modals (settings/edit name) remain visible.
        const target = document.documentElement || libReaderUI.root;
        const request = target.requestFullscreen || target.webkitRequestFullscreen || target.msRequestFullscreen;
        if (typeof request === 'function') {
            try { await request.call(target); } catch (e) { /* fallback below */ }
        }
        if (!libReaderFullscreenElement()) {
            await sleep(80);
        }
        if (!libReaderFullscreenElement()) {
            libReaderState = libReaderState || {};
            libReaderState.fullscreenFallback = true;
        }
        libReaderRefreshFullscreenMode();
    }

    function libReaderHandleFullscreenContentTap(event) {
        if (!libReaderIsFullscreenActive()) return;
        if (event?.target?.closest?.('button, input, textarea, select, [contenteditable="true"], .tm-name')) return;
        const sel = window.getSelection();
        if (sel && sel.toString().trim()) return;
        const isVisible = libReaderUI?.root?.classList.contains('tm-reader-fullscreen-ui-visible');
        libReaderSetFullscreenUiVisible(!isVisible, { autoHideMs: isVisible ? 0 : 2200 });
    }

    function libReaderHandleKeydown(event) {
        if (!libReaderIsFullscreenActive()) return;
        if (String(event.key || '') !== 'Escape') return;
        event.preventDefault();
        libReaderExitFullscreen();
    }

    function libReaderEnterCleanMode() {
        if (libReaderState?.cleanMode) return;
        libReaderState = libReaderState || {};
        libReaderState.cleanMode = true;
        try { window.stop(); } catch (e) { /* ignore */ }
        try {
            document.querySelectorAll('iframe, script').forEach(el => el.remove());
            document.querySelectorAll('video, audio').forEach(el => {
                try { el.pause(); } catch (e) { /* ignore */ }
                el.remove();
            });
        } catch (e) { /* ignore */ }
        if (document.head) document.head.innerHTML = '';
        if (document.body) document.body.innerHTML = '';
        if (!document.head) {
            const head = document.createElement('head');
            document.documentElement.prepend(head);
        }
        if (!document.body) {
            const body = document.createElement('body');
            document.documentElement.appendChild(body);
        }
        injectGlobalCSS();
    }

    function libReaderApplySettings() {
        if (!libReaderUI) return;
        config = loadConfig();
        const style = config.readerStyle || DEFAULT_CONFIG.readerStyle;
        const bg = (style.bgColor || '#f7f4ee').trim();
        const text = (style.textColor || '#1f1f1f').trim();
        const rgb = (hex) => {
            const clean = hex.replace('#', '');
            if (clean.length !== 6) return null;
            const r = parseInt(clean.slice(0, 2), 16);
            const g = parseInt(clean.slice(2, 4), 16);
            const b = parseInt(clean.slice(4, 6), 16);
            return { r, g, b };
        };
        const mix = (c1, c2, t) => ({
            r: Math.round(c1.r + (c2.r - c1.r) * t),
            g: Math.round(c1.g + (c2.g - c1.g) * t),
            b: Math.round(c1.b + (c2.b - c1.b) * t)
        });
        const toHex = (c) => `#${[c.r, c.g, c.b].map(v => v.toString(16).padStart(2, '0')).join('')}`;
        const bgRgb = rgb(bg) || { r: 247, g: 244, b: 238 };
        const luminance = (c) => (0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b) / 255;
        const isLight = luminance(bgRgb) > 0.6;
        const surface = toHex(mix(bgRgb, isLight ? { r: 255, g: 255, b: 255 } : { r: 0, g: 0, b: 0 }, isLight ? 0.08 : 0.2));
        const border = toHex(mix(bgRgb, isLight ? { r: 0, g: 0, b: 0 } : { r: 255, g: 255, b: 255 }, isLight ? 0.15 : 0.25));
        const textRgb = rgb(text) || { r: 31, g: 31, b: 31 };
        const muted = toHex(mix(textRgb, bgRgb, 0.45));
        const hover = toHex(mix(bgRgb, textRgb, isLight ? 0.08 : 0.2));
        const active = toHex(mix(bgRgb, textRgb, isLight ? 0.12 : 0.28));

        libReaderUI.root.style.setProperty('--tm-reader-bg', bg);
        libReaderUI.root.style.setProperty('--tm-reader-text', text);
        libReaderUI.root.style.setProperty('--tm-reader-surface', surface);
        libReaderUI.root.style.setProperty('--tm-reader-border', border);
        libReaderUI.root.style.setProperty('--tm-reader-muted', muted);
        libReaderUI.root.style.setProperty('--tm-reader-hover', hover);
        libReaderUI.root.style.setProperty('--tm-reader-active', active);
        libReaderUI.root.style.setProperty('--tm-reader-spacer', '120px');
        libReaderUI.root.style.setProperty('--tm-reader-font', style.fontFamily || DEFAULT_CONFIG.readerStyle.fontFamily);
        libReaderUI.root.style.setProperty('--tm-reader-font-size', `${style.fontSize || DEFAULT_CONFIG.readerStyle.fontSize}px`);
        libReaderUI.root.style.setProperty('--tm-reader-line-height', style.lineHeight || DEFAULT_CONFIG.readerStyle.lineHeight);
        libReaderUI.root.style.setProperty('--tm-reader-paragraph-spacing', `${style.paragraphSpacing ?? DEFAULT_CONFIG.readerStyle.paragraphSpacing}px`);
        libReaderUI.root.style.setProperty('--tm-reader-text-indent', `${style.textIndent ?? DEFAULT_CONFIG.readerStyle.textIndent}em`);
        libReaderUI.root.style.setProperty('--tm-reader-padding-x', `${(style.paddingX ?? DEFAULT_CONFIG.readerStyle.paddingX)}px`);
        libReaderUI.root.style.setProperty('--tm-reader-text-align', style.textAlign || DEFAULT_CONFIG.readerStyle.textAlign);
        const isFullscreen = libReaderIsFullscreenActive();
        if (libReaderState) libReaderState.fullscreen = isFullscreen;
        libReaderUI.root.classList.toggle('tm-reader-fullscreen', isFullscreen);
        if (libReaderUI.btnFullscreen) {
            libReaderUI.btnFullscreen.textContent = isFullscreen ? 'Thoát full' : 'Fullscreen';
        }

        const viewMode = config.readerMode === 'vertical' ? 'vertical' : 'single';
        libReaderUI.root.classList.remove('tm-reader-mode-single', 'tm-reader-mode-vertical');
        libReaderUI.root.classList.add(`tm-reader-mode-${viewMode}`);
        if (libReaderState) libReaderState.viewMode = viewMode;
        libReaderUpdateMiniInfo();
    }

    function libReaderGetCurrentScrollRatio() {
        if (!libReaderState || !libReaderUI?.contentWrap) return 0;
        const wrap = libReaderUI.contentWrap;
        const max = wrap.scrollHeight - wrap.clientHeight;
        if (max <= 0) return 0;
        return Math.max(0, Math.min(1, wrap.scrollTop / max));
    }

    function libReaderSaveProgressNow() {
        if (!libReaderState) return;
        if (libReaderState.scrollSaveTimer) {
            clearTimeout(libReaderState.scrollSaveTimer);
            libReaderState.scrollSaveTimer = null;
        }
        const currentChapter = libReaderState.chapters?.[libReaderState.currentIndex];
        if (!currentChapter) return;
        const ratio = libReaderGetCurrentScrollRatio();
        libReaderState.lastScrollRatio = ratio;
        const order = currentChapter.order || (libReaderState.currentIndex + 1);
        libUpdateBookLastRead(libReaderState.book.bookId, currentChapter.chapterId, ratio, order);
    }

    function libReaderHandleVisibilityChange() {
        if (document.visibilityState === 'hidden') {
            libReaderSaveProgressNow();
        }
    }

    function libReaderClose() {
        libReaderTtsStop({ silent: true });
        libReaderSaveProgressNow();
        const el = document.getElementById('tm-reader-overlay');
        if (el) el.remove();
        libReaderState = null;
        libReaderUI = null;
        location.reload();
    }

    function libReaderSetMode(mode) {
        if (!libReaderState) return;
        if (libReaderState.book.langSource === 'vi') return;
        libReaderTtsStop({ silent: true });
        libReaderState.mode = mode === 'raw' ? 'raw' : 'trans';
        libReaderUpdateModeButtons();
        libReaderLoadCurrentChapter();
    }

    function libReaderUpdateModeButtons() {
        if (!libReaderUI || !libReaderState) return;
        libReaderUI.btnRaw.classList.toggle('active', libReaderState.mode === 'raw');
        libReaderUI.btnTrans.classList.toggle('active', libReaderState.mode === 'trans');
    }

    const LIB_READER_BOUNDARY_CONFIRM_IDLE_MS = 260;
    const LIB_READER_BOUNDARY_CONFIRM_TTL_MS = 3500;

    function libReaderClearBoundaryGate() {
        if (!libReaderState) return;
        const gate = libReaderState.chapterBoundaryGate;
        if (gate?.timer) clearTimeout(gate.timer);
        libReaderState.chapterBoundaryGate = null;
    }

    function libReaderCanChangeAtBoundary(edge) {
        if (!libReaderState?.chapters?.length) return false;
        if (edge === 'top') return libReaderState.currentIndex > 0;
        if (edge === 'bottom') return libReaderState.currentIndex < libReaderState.chapters.length - 1;
        return false;
    }

    function libReaderConfirmBoundaryScroll(edge) {
        if (!libReaderState || libReaderState.isSwitching || !libReaderCanChangeAtBoundary(edge)) {
            libReaderClearBoundaryGate();
            return false;
        }
        const now = Date.now();
        let gate = libReaderState.chapterBoundaryGate;
        if (!gate || gate.edge !== edge || now - gate.armedAt > LIB_READER_BOUNDARY_CONFIRM_TTL_MS) {
            if (gate?.timer) clearTimeout(gate.timer);
            gate = { edge, armedAt: now, ready: false, timer: null };
            libReaderState.chapterBoundaryGate = gate;
        }
        if (gate.ready) {
            libReaderClearBoundaryGate();
            libReaderGo(edge === 'bottom' ? 1 : -1, { scrollTo: edge === 'bottom' ? 'top' : 'bottom' });
            return true;
        }
        if (gate.timer) clearTimeout(gate.timer);
        gate.timer = setTimeout(() => {
            if (libReaderState?.chapterBoundaryGate === gate) {
                gate.ready = true;
                gate.timer = null;
            }
        }, LIB_READER_BOUNDARY_CONFIRM_IDLE_MS);
        return false;
    }

    async function libReaderGo(offset, options = {}) {
        if (!libReaderState || libReaderState.isSwitching) return;
        const nextIndex = libReaderState.currentIndex + offset;
        if (nextIndex < 0 || nextIndex >= libReaderState.chapters.length) return;
        if (!options.fromTts) libReaderTtsStop({ silent: true });
        libReaderClearBoundaryGate();
        libReaderState.currentIndex = nextIndex;
        libReaderState.isSwitching = true;
        await libReaderLoadCurrentChapter(options);
        libReaderState.isSwitching = false;
    }

    async function libReaderGoTo(index, options = {}) {
        if (!libReaderState || libReaderState.isSwitching) return;
        if (index < 0 || index >= libReaderState.chapters.length) return;
        if (!options.fromTts) libReaderTtsStop({ silent: true });
        libReaderClearBoundaryGate();
        libReaderState.currentIndex = index;
        libReaderState.isSwitching = true;
        await libReaderLoadCurrentChapter(options);
        libReaderState.isSwitching = false;
    }

    async function libReaderRenderToc() {
        if (!libReaderUI || !libReaderState) return;
        const chapters = libReaderState.chapters;
        const activeIndex = libReaderState.currentIndex;
        libReaderUI.toc.innerHTML = chapters.map((ch, idx) => {
            const title = escapeHtml(ch.title || `Chương ${idx + 1}`);
            const active = idx === activeIndex ? 'active' : '';
            return `<div class="tm-reader-toc-item ${active}" data-index="${idx}">${title}</div>`;
        }).join('');
        libReaderUI.toc.querySelectorAll('.tm-reader-toc-item').forEach(item => {
            item.addEventListener('click', () => {
                const idx = parseInt(item.getAttribute('data-index') || '0', 10);
                libReaderGoTo(idx);
                libReaderSetTocOpen(false);
            });
        });

        if (libReaderState.book.langSource === 'vi' || libReaderState.mode === 'raw') return;

        const version = config.nameSetVersion || 1;
        const rawTitles = chapters.map((ch, idx) => ch.title || `Chương ${idx + 1}`);
        try {
            const translatedText = await translatePanelText(rawTitles.join('\n'), 'text');
            const lines = translatedText.split(/\r?\n/);
            libReaderUI.toc.querySelectorAll('.tm-reader-toc-item').forEach((item, idx) => {
                const title = lines[idx] || rawTitles[idx];
                const cacheKey = `chap:${chapters[idx].chapterId}:${version}:${rawTitles[idx]}`;
                libTitleCache.set(cacheKey, title);
                libReaderState.titleCache = libReaderState.titleCache || new Map();
                libReaderState.titleCache.set(cacheKey, title);
                item.textContent = title;
            });
        } catch (err) {
            console.error(err);
        }
    }

    function libReaderHandleScroll() {
        if (!libReaderState || !libReaderUI?.contentWrap) return;
        const wrap = libReaderUI.contentWrap;
        const viewMode = libReaderState.viewMode || 'single';
        const prevTop = libReaderState.prevScrollTop ?? wrap.scrollTop;
        const delta = wrap.scrollTop - prevTop;
        if (libReaderState.ignoreScrollUntil && Date.now() < libReaderState.ignoreScrollUntil) {
            libReaderState.prevScrollTop = wrap.scrollTop;
            libReaderState.prevScrollLeft = wrap.scrollLeft;
            return;
        }
        let ratio = 0;
        const max = wrap.scrollHeight - wrap.clientHeight;
        ratio = max > 0 ? wrap.scrollTop / max : 0;
        libReaderState.lastScrollRatio = ratio;
        libReaderState.lastScrollTop = wrap.scrollTop;
        libReaderState.lastScrollLeft = wrap.scrollLeft;
        libReaderUpdateMiniInfo();
        if (libReaderState.scrollSaveTimer) clearTimeout(libReaderState.scrollSaveTimer);
        libReaderState.scrollSaveTimer = setTimeout(() => {
            libReaderSaveProgressNow();
        }, 300);

        const threshold = (config.readerPrefetchPercent || 50) / 100;
        if (ratio >= threshold && libReaderState.book.langSource === 'zh') {
            libReaderPrefetchNextChapter();
        }

        if (viewMode === 'vertical') {
            const max = wrap.scrollHeight - wrap.clientHeight;
            const nearBottom = max > 0 && wrap.scrollTop >= max - 8;
            const nearTop = wrap.scrollTop <= 2;
            const direction = delta;
            libReaderState.prevScrollTop = wrap.scrollTop;
            if (nearBottom && direction > 0 && libReaderState.currentIndex < libReaderState.chapters.length - 1) {
                libReaderConfirmBoundaryScroll('bottom');
            } else if (nearTop && direction < 0 && libReaderState.currentIndex > 0) {
                libReaderConfirmBoundaryScroll('top');
            } else if (direction !== 0) {
                libReaderClearBoundaryGate();
            }
        }
    }

    function libReaderHandleWheel(e) {
        if (!libReaderState || !libReaderUI?.contentWrap) return;
        const wrap = libReaderUI.contentWrap;
        const viewMode = libReaderState.viewMode || 'single';
        if (viewMode !== 'vertical') return;

        const max = wrap.scrollHeight - wrap.clientHeight;
        const atTop = wrap.scrollTop <= 2;
        const atBottom = max > 0 && wrap.scrollTop >= max - 2;
        const deltaY = e.deltaY || 0;

        if (atTop && deltaY < 0) {
            libReaderConfirmBoundaryScroll('top');
            return;
        }

        if (atBottom && deltaY > 0) {
            libReaderConfirmBoundaryScroll('bottom');
            return;
        }

        if (deltaY !== 0) libReaderClearBoundaryGate();
    }

    function libReaderBoundaryTouchStart(event) {
        if (!libReaderState) return;
        libReaderState.boundaryTouchY = libReaderEventPoint(event).y;
    }

    function libReaderBoundaryTouchMove(event) {
        if (!libReaderState || !libReaderUI?.contentWrap) return;
        if ((libReaderState.viewMode || 'single') !== 'vertical') return;
        const wrap = libReaderUI.contentWrap;
        const point = libReaderEventPoint(event);
        const prevY = typeof libReaderState.boundaryTouchY === 'number' ? libReaderState.boundaryTouchY : point.y;
        const touchDeltaY = point.y - prevY;
        libReaderState.boundaryTouchY = point.y;
        if (Math.abs(touchDeltaY) < 8) return;

        const max = wrap.scrollHeight - wrap.clientHeight;
        const atTop = wrap.scrollTop <= 2;
        const atBottom = max > 0 && wrap.scrollTop >= max - 2;
        if (atTop && touchDeltaY > 0) {
            libReaderConfirmBoundaryScroll('top');
            return;
        }
        if (atBottom && touchDeltaY < 0) {
            libReaderConfirmBoundaryScroll('bottom');
            return;
        }
        libReaderClearBoundaryGate();
    }

    function libReaderBoundaryTouchEnd() {
        if (!libReaderState) return;
        libReaderState.boundaryTouchY = null;
    }

    async function libReaderPrefetchNextChapter() {
        if (!libReaderState) return;
        const nextIndex = libReaderState.currentIndex + 1;
        if (nextIndex >= libReaderState.chapters.length) return;
        const nextChapter = libReaderState.chapters[nextIndex];
        if (!nextChapter || !nextChapter.rawKey) return;
        const expectedKey = libMakeTransKey(nextChapter.chapterId, nextChapter.rawKey);
        const { wasNormalized } = await libGetNormalizedRawChapterContent(nextChapter);
        const needsRefresh = wasNormalized;
        if (!needsRefresh && nextChapter.transKey === expectedKey) {
            const cached = await libGet('tm_content', expectedKey);
            if (cached?.text) return;
        }
        libReaderState.prefetching = libReaderState.prefetching || new Set();
        if (libReaderState.prefetching.has(nextChapter.chapterId)) return;
        libReaderState.prefetching.add(nextChapter.chapterId);
        try {
            await libTranslateAndCacheChapter(nextChapter.chapterId);
        } catch (err) {
            console.error(err);
        }
    }

    async function libReaderResolveChapterText(chapter) {
        const { rawText, wasNormalized } = await libGetNormalizedRawChapterContent(chapter);
        if (libReaderState.book.langSource === 'vi' || libReaderState.mode === 'raw') {
            return rawText;
        }
        const needsRefresh = wasNormalized;
        const expectedKey = libMakeTransKey(chapter.chapterId, chapter.rawKey);
        if (!needsRefresh && chapter.transKey === expectedKey) {
            const cached = await libGet('tm_content', expectedKey);
            if (cached?.text) return restoreTranslatedNameCasing(cached.text);
        }
        try {
            return await libTranslateAndCacheChapter(chapter.chapterId);
        } catch (err) {
            console.error(err);
            showNotification('Dịch chương thất bại.');
            return '';
        }
    }

    function libReaderBuildHtmlFromRawAndTrans(rawText, transText) {
        config = loadConfig();
        const nameSet = config.nameSets[config.activeNameSet] || {};
        const normalize = (s) => libNormalizeChapterParagraphBreaks(s || '');
        const normalizedRaw = normalize(rawText);
        const normalizedTrans = normalize(transText);
        const rawParas = normalizedRaw ? normalizedRaw.split(/\n/) : [];
        const transParas = normalizedTrans ? normalizedTrans.split(/\n/) : [];
        const max = Math.max(rawParas.length, transParas.length);
        let html = '';
        let lastWasEmpty = false;
        for (let i = 0; i < max; i++) {
            const rawPara = rawParas[i] ?? '';
            const transPara = transParas[i] ?? '';
            if (!rawPara.trim() && !transPara.trim()) {
                if (!lastWasEmpty) {
                    html += '<p><br></p>';
                }
                lastWasEmpty = true;
                continue;
            }
            lastWasEmpty = false;
            const highlighted = highlightNamesInText(transPara || '', nameSet, rawPara);
            const chunkHtml = `<span class="tm-chunk" data-orig="${escapeHtml(rawPara)}">${highlighted || ''}</span>`;
            html += `<p>${chunkHtml}</p>`;
        }
        return html;
    }

    async function libReaderResolveChapterDisplay(chapter, options = {}) {
        const { rawText, wasNormalized } = await libGetNormalizedRawChapterContent(chapter);
        if (libReaderState.book.langSource === 'vi' || libReaderState.mode === 'raw') {
            const displayText = libNormalizeChapterParagraphBreaks(rawText);
            return { text: displayText, html: null, rawText };
        }
        const expectedKey = libMakeTransKey(chapter.chapterId, chapter.rawKey);
        const needsRefresh = wasNormalized;
        let transText = '';
        if (!needsRefresh && chapter.transKey === expectedKey) {
            const cached = await libGet('tm_content', expectedKey);
            if (cached?.text) transText = restoreTranslatedNameCasing(cached.text);
        }
        if (!transText) {
            if (typeof options.onTranslateStart === 'function') {
                options.onTranslateStart();
            }
            try {
                transText = await libTranslateAndCacheChapter(chapter.chapterId);
            } catch (err) {
                console.error(err);
                showNotification('Dịch chương thất bại.');
                transText = '';
            } finally {
                if (typeof options.onTranslateEnd === 'function') {
                    options.onTranslateEnd();
                }
            }
        }
        const html = libReaderBuildHtmlFromRawAndTrans(rawText, transText);
        return { text: transText, html, rawText };
    }

    async function libReaderResolveChapterTitle(chapter, indexHint) {
        const fallbackTitle = chapter.title || `Chương ${(indexHint ?? libReaderState?.currentIndex ?? 0) + 1}`;
        if (!libReaderState || libReaderState.book.langSource === 'vi' || libReaderState.mode === 'raw') {
            return fallbackTitle;
        }
        const version = config.nameSetVersion || 1;
        libReaderState.titleCache = libReaderState.titleCache || new Map();
        const cacheKey = `chap:${chapter.chapterId}:${version}:${fallbackTitle}`;
        if (libReaderState.titleCache.has(cacheKey)) {
            return libReaderState.titleCache.get(cacheKey);
        }
        if (libTitleCache.has(cacheKey)) {
            const cached = libTitleCache.get(cacheKey);
            libReaderState.titleCache.set(cacheKey, cached);
            return cached;
        }
        try {
            const translated = await translatePanelText(fallbackTitle, 'text');
            const title = (translated || fallbackTitle).split(/\r?\n/)[0];
            libReaderState.titleCache.set(cacheKey, title);
            libTitleCache.set(cacheKey, title);
            return title;
        } catch (err) {
            console.error(err);
            return fallbackTitle;
        }
    }

    async function libReaderResolveBookTitle(book) {
        const fallbackTitle = book?.title || 'Untitled';
        if (!libReaderState || book?.langSource === 'vi' || libReaderState.mode === 'raw') {
            return fallbackTitle;
        }
        const version = config.nameSetVersion || 1;
        libReaderState.bookTitleCache = libReaderState.bookTitleCache || new Map();
        const cacheKey = `book:${book.bookId || ''}:${version}:${fallbackTitle}`;
        if (libReaderState.bookTitleCache.has(cacheKey)) {
            return libReaderState.bookTitleCache.get(cacheKey);
        }
        if (libTitleCache.has(cacheKey)) {
            const cached = libTitleCache.get(cacheKey);
            libReaderState.bookTitleCache.set(cacheKey, cached);
            return cached;
        }
        try {
            const translated = await translatePanelText(fallbackTitle, 'text');
            const title = (translated || fallbackTitle).split(/\r?\n/)[0];
            libReaderState.bookTitleCache.set(cacheKey, title);
            libTitleCache.set(cacheKey, title);
            return title;
        } catch (err) {
            console.error(err);
            return fallbackTitle;
        }
    }

    async function libReaderRenderVerticalChapter(index, options = {}) {
        if (!libReaderState || !libReaderUI) return;
        const chapter = libReaderState.chapters[index];
        if (!chapter) return;

        const prev = index > 0 ? libReaderState.chapters[index - 1] : null;
        const next = index + 1 < libReaderState.chapters.length ? libReaderState.chapters[index + 1] : null;

        const title = await libReaderResolveChapterTitle(chapter, index);

        libReaderUI.content.innerHTML = '';

        const topSpacer = document.createElement('div');
        topSpacer.className = 'tm-reader-spacer';
        topSpacer.textContent = prev ? `Kéo lên để về: ${await libReaderResolveChapterTitle(prev, index - 1)}` : 'Đầu truyện';
        libReaderUI.content.appendChild(topSpacer);

        if (prev) {
            const sepTop = document.createElement('div');
            sepTop.className = 'tm-reader-sep';
            sepTop.textContent = `Chương trước: ${await libReaderResolveChapterTitle(prev, index - 1)}`;
            libReaderUI.content.appendChild(sepTop);
        }

        const blockTitle = document.createElement('div');
        blockTitle.className = 'tm-reader-block-title';
        blockTitle.textContent = title || `Chương ${index + 1}`;
        libReaderUI.content.appendChild(blockTitle);

        const blockText = document.createElement('div');
        blockText.className = 'tm-reader-block-text';
        const display = await libReaderResolveChapterDisplay(chapter, {
            onTranslateStart: () => { blockText.textContent = 'Đang dịch...'; }
        });
        if (display.html && libReaderState.mode === 'trans' && libReaderState.book.langSource === 'zh') {
            blockText.innerHTML = display.html;
        } else {
            blockText.innerHTML = libTextToHtml(display.text || 'Chương trống.');
        }
        libReaderUI.content.appendChild(blockText);

        if (next) {
            const sepBottom = document.createElement('div');
            sepBottom.className = 'tm-reader-sep';
            sepBottom.textContent = `Chương tiếp: ${await libReaderResolveChapterTitle(next, index + 1)}`;
            libReaderUI.content.appendChild(sepBottom);
        }

        const bottomSpacer = document.createElement('div');
        bottomSpacer.className = 'tm-reader-spacer';
        bottomSpacer.textContent = next ? `Kéo xuống để sang: ${await libReaderResolveChapterTitle(next, index + 1)}` : 'Hết truyện';
        libReaderUI.content.appendChild(bottomSpacer);

        if (libReaderUI.contentWrap) {
            if (options.scrollTo === 'bottom') {
                const max = libReaderUI.contentWrap.scrollHeight - libReaderUI.contentWrap.clientHeight;
                const spacer = 120;
                libReaderUI.contentWrap.scrollTop = Math.max(0, max - spacer - 2);
                if (libReaderState) libReaderState.ignoreScrollUntil = Date.now() + 400;
            } else if (options.scrollTo === 'restore' && libReaderState.book.lastReadChapterId === chapter.chapterId && typeof libReaderState.book.lastReadScrollRatio === 'number') {
                const max = libReaderUI.contentWrap.scrollHeight - libReaderUI.contentWrap.clientHeight;
                if (max > 0) {
                    libReaderUI.contentWrap.scrollTop = Math.floor(max * libReaderState.book.lastReadScrollRatio);
                }
                if (libReaderState) libReaderState.ignoreScrollUntil = Date.now() + 400;
            } else {
                const spacer = 120;
                libReaderUI.contentWrap.scrollTop = spacer;
                if (libReaderState) libReaderState.ignoreScrollUntil = Date.now() + 200;
            }
        }
    }

    async function libReaderAppendChapterBlock(index) {
        if (!libReaderState || !libReaderUI) return;
        if (index < 0 || index >= libReaderState.chapters.length) return;
        libReaderState.renderedIndices = libReaderState.renderedIndices || new Set();
        if (libReaderState.renderedIndices.has(index)) return;

        const chapter = libReaderState.chapters[index];
        const block = document.createElement('section');
        block.className = 'tm-reader-block';
        block.dataset.chapterId = chapter.chapterId;
        block.innerHTML = `
            <div class="tm-reader-sep">— Chương ${index + 1} —</div>
            <div class="tm-reader-block-title">${escapeHtml(chapter.title || `Chương ${index + 1}`)}</div>
            <div class="tm-reader-block-text">Đang dịch...</div>
        `;
        libReaderUI.content.appendChild(block);
        const blockText = block.querySelector('.tm-reader-block-text');
        const display = await libReaderResolveChapterDisplay(chapter, {
            onTranslateStart: () => { if (blockText) blockText.textContent = 'Đang dịch...'; }
        });
        if (blockText) {
            if (display.html && libReaderState.mode === 'trans' && libReaderState.book.langSource === 'zh') {
                blockText.innerHTML = display.html;
            } else {
                blockText.innerHTML = libTextToHtml(display.text || '');
            }
        }
        libReaderState.renderedIndices.add(index);
    }

    async function libReaderLoadCurrentChapter(options = {}) {
        if (!libReaderState || !libReaderUI) return;
        const { book, chapters, currentIndex } = libReaderState;
        const chapter = chapters[currentIndex];
        if (!chapter) return;

        libReaderClearBoundaryGate();
        libReaderApplySettings();
        libReaderUI.bookTitle.textContent = await libReaderResolveBookTitle(book);
        libReaderUI.chapterSub.textContent = `Chương ${currentIndex + 1} / ${chapters.length}`;
        libReaderUI.chapterTitle.textContent = chapter.title || `Chương ${currentIndex + 1}`;
        libReaderState.lastScrollRatio = (book.lastReadChapterId === chapter.chapterId && typeof book.lastReadScrollRatio === 'number')
            ? Math.max(0, Math.min(1, book.lastReadScrollRatio))
            : 0;
        libReaderUpdateMiniInfo();

        libReaderUI.btnPrev.disabled = currentIndex === 0;
        libReaderUI.btnNext.disabled = currentIndex >= chapters.length - 1;

        await libReaderRenderToc();
        libReaderUpdateModeButtons();
        libUpdateBookLastRead(book.bookId, chapter.chapterId, undefined, chapter.order || (currentIndex + 1));

        const viewMode = libReaderState.viewMode || 'single';
        libReaderState.renderedIndices = new Set();
        libReaderUI.content.innerHTML = '';

        if (viewMode === 'vertical') {
            const title = await libReaderResolveChapterTitle(chapter, currentIndex);
            libReaderUI.chapterTitle.textContent = title;
            await libReaderRenderVerticalChapter(currentIndex, options.scrollTo ? options : { scrollTo: 'restore' });
            libReaderUpdateMiniInfo();
            return;
        }

        const title = await libReaderResolveChapterTitle(chapter, currentIndex);
        libReaderUI.chapterTitle.textContent = title;
        const display = await libReaderResolveChapterDisplay(chapter, {
            onTranslateStart: () => {
                libReaderUI.content.textContent = 'Đang dịch...';
            }
        });
        if (display.html && libReaderState.mode === 'trans' && libReaderState.book.langSource === 'zh') {
            libReaderUI.content.innerHTML = display.html;
        } else {
            libReaderUI.content.innerHTML = libTextToHtml(display.text || 'Chương trống.');
        }
        if (libReaderUI.contentWrap && book.lastReadChapterId === chapter.chapterId && typeof book.lastReadScrollRatio === 'number') {
            const max = libReaderUI.contentWrap.scrollHeight - libReaderUI.contentWrap.clientHeight;
            if (max > 0) {
                libReaderUI.contentWrap.scrollTop = Math.floor(max * book.lastReadScrollRatio);
            }
        }
        libReaderUpdateMiniInfo();
    }

    async function openLibraryReader(bookId) {
        const book = libFindBookInIndex(bookId);
        if (!book) {
            showNotification('Không tìm thấy truyện.');
            return;
        }
        const chapters = await libGetChaptersByBook(bookId);
        if (!chapters.length) {
            showNotification('Truyện chưa có chương.');
            return;
        }
        libReaderEnterCleanMode();
        const ui = libReaderEnsureUI();
        ui.root.classList.toggle('tm-reader-no-translate', book.langSource === 'vi');

        let startIndex = 0;
        if (book.lastReadChapterId) {
            const found = chapters.findIndex(ch => ch.chapterId === book.lastReadChapterId);
            if (found >= 0) startIndex = found;
        }

        libReaderState = {
            book,
            chapters,
            currentIndex: startIndex,
            mode: book.langSource === 'vi' ? 'raw' : 'trans',
            lastScrollRatio: typeof book.lastReadScrollRatio === 'number' ? book.lastReadScrollRatio : 0,
            prefetching: new Set(),
            scrollSaveTimer: null,
            chapterBoundaryGate: null,
            boundaryTouchY: null,
            fullscreen: false
        };

        libReaderApplySettings();
        libReaderUpdateModeButtons();
        await libReaderLoadCurrentChapter();
        libMaybeRunBackgroundBackup().catch(err => console.warn('[tm-translate] Sao lưu ngầm khi mở reader lỗi:', err));
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

    /* ================== WELCOME / UPDATE POPUP ================== */
    function renderHelpMarkdown(md) {
        const safe = md.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const lines = safe.split('\n');
        const htmlParts = [];
        let inList = false;
        const flushList = () => { if (inList) { htmlParts.push('</ul>'); inList = false; } };
        const escapeAttr = (value) => String(value || '').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
        const formatInline = (text) => String(text || '')
            .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (_match, label, url) => {
                return `<a href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
            })
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/`(.+?)`/g, '<code>$1</code>');
        lines.forEach((raw) => {
            const line = raw.trimEnd();
            if (line.startsWith('### ')) { flushList(); htmlParts.push(`<h3>${formatInline(line.slice(4))}</h3>`); return; }
            if (line.startsWith('- ')) {
                if (!inList) { htmlParts.push('<ul>'); inList = true; }
                const content = formatInline(line.slice(2));
                htmlParts.push(`<li>${content}</li>`);
                return;
            }
            if (line === '') { flushList(); return; }
            const content = formatInline(line);
            htmlParts.push(`<p>${content}</p>`);
        });
        flushList();
        return htmlParts.join('\n');
    }

    const welcomeHtml = `
<div class="tm-welcome-title">🌸 Chào mừng đến với TM Translate 🌸</div>
		<div class="tm-welcome-sub">TM Translate v${CURRENT_VERSION} • Dịch trang web Trung → Việt, quản lý Name-set, Thư viện đọc offline, OCR dịch ảnh và TTS</div>
		<div class="tm-welcome-banner">
		  <strong>✨ v${CURRENT_VERSION}:</strong> Thư viện chống dính CSS web tốt hơn, sao lưu/khôi phục bằng file dùng được trên mobile, và core TTS không còn unsafe-eval.
	</div>
<div style="height:8px;"></div>
    `.trim();

    const guideMarkdown = `
### 🟢 Nút Nổi (Floating Buttons)
- **Dịch Trang** (xanh lá): Dịch toàn bộ trang. Có tự động dịch khi cuộn nếu bật trong Cài đặt.
- **Thư viện** (xanh ngọc): Mở Thư viện toàn màn hình để import/đọc/export, tìm kiếm, đổi bìa và sao lưu/khôi phục truyện.
- **Edit Name** (xanh dương, hình bút chì): Bôi đen đoạn đã dịch trên web → bấm bút chì để sửa tên.
- **Dịch Nhanh** (xám): Dán text và dịch nhanh mà không cần dịch cả trang.
- **OCR** (teal): Dịch chữ trong ảnh — khoanh vùng hoặc dịch ảnh.
- **Style** (tối): Tùy chỉnh giao diện Chế độ đọc rút gọn.
- **Quay Về** (vàng): Quay lại trang gốc chưa dịch.

### 📚 Thư Viện & Đọc Truyện
- Import **TXT/EPUB**, chọn ngôn ngữ nguồn (Trung → có RAW/DỊCH, Việt → chỉ đọc).
- Reader có: RAW/DỊCH, Fullscreen, Mục lục, cache dịch + prefetch chương, nút mở nhanh Cài đặt/TTS.
- Thư viện hiển thị dạng toàn màn hình, truyện vừa đọc nằm trước, có tổng số truyện, phân trang/lazy load khi cuộn và bìa mặc định cho từng truyện.
- Có thể đổi ảnh bìa từng truyện bằng ảnh user chọn; ảnh bìa được lưu cùng metadata và đi theo backup.
- Ô tìm kiếm hỗ trợ popup chọn phạm vi: tên truyện, tác giả, raw Trung và cache dịch.
- **Sao lưu/Khôi phục** dùng file \`.tmbackup.jsonl\`: bấm **Sao lưu** để tải file backup, bấm **Khôi phục** để chọn file đó nhập lại. File gồm index thư viện, raw, cache dịch và ảnh bìa.
- Bôi đen text trong Reader sẽ hiện thanh **Phát / Sửa tên hoặc Thay thế từ / Xóa rác / Sao chép**. Trên mobile, menu copy/share mặc định của máy được ẩn trong Reader.
- **Phát** mở mini-player TTS và đọc từ vị trí bôi đen tới hết chương; nếu bật **Tự qua đoạn/chương** + **Tự đọc chương kế** thì tự sang chương sau.
- Mini-player có đĩa quay, Tạm dừng/Phát, Tiếp, Dừng, countdown hẹn giờ ngủ, highlight đoạn đang đọc và tự cuộn khi bật.
- Khi tới cuối chương mà chưa bật đủ **Tự qua đoạn/chương** + **Tự đọc chương kế**, TTS sẽ phát thông báo nhắc bật hai tùy chọn này rồi dừng; khi hết truyện sẽ phát thông báo đã tới cuối truyện.
- TTS ưu tiên ngắt đoạn tại dấu câu/xuống dòng; remote TTS prefetch trước các đoạn kế tiếp và phát audio giữ media âm lượng rất thấp khi phải chờ audio thật.
- Truyện Trung RAW+DỊCH: **Sửa tên** dùng được cả khi chọn text ở RAW hoặc DỊCH. Truyện chỉ RAW: nút đổi thành **Thay thế từ**.
- **Xóa rác** luôn mở popup để sửa đoạn raw trước khi xác nhận; có tùy chọn không phân biệt hoa thường khi cần.
- Kiểu đọc cuộn dọc: chạm đầu/cuối chương rồi cuộn thêm một nhịp mới chuyển chương.
- Tự lưu **tiến độ đọc** (chương + vị trí cuộn).
- Xuất **TXT/EPUB/HTML** với cache dịch & Name-set hiện tại. HTML có giao diện đọc, cài đặt và fullscreen riêng; truyện lớn sẽ được đề xuất xuất **EPUB** vì HTML nhúng toàn bộ data dễ lag khi mở/xem.

### 📷 OCR (Dịch Ảnh)
- Chạy trên trình duyệt (không gửi ảnh lên server lạ).
- Chế độ: **Khoanh vùng** hoặc **Dịch ảnh**. Nguồn: màn hình hoặc import.
- Kết quả có thể bôi đen copy, click tên highlight để Edit Name.

### ⚙️ Cài Đặt
- **Tab Chung**: Chế độ dịch (Server/Local), bật/tắt nút, Simplified View, chặn JS.
- **Tab Bộ Tên**: Tạo/Xóa bộ name, nhập file JSON/TXT, xuất, thêm/sửa nhanh.
- **Tab Thư viện**: Hiển thị nút, prefetch, kiểu đọc và giao diện reader.
- **Tab TTS**: Chọn nguồn Browser/TikTok/Google/Gemini/Bing/Zalo, giọng đọc, tốc độ/cao độ/âm lượng, độ dài đoạn, delay, hẹn giờ ngủ, prefetch remote, retry/timeout/request gap và thay thế từ trước khi đọc.
- Hẹn giờ ngủ chỉ chạy khi bật checkbox; cookie TikTok/API key Zalo được lưu ngay khi bấm **Lưu** trong popup.
- Khi hẹn giờ ngủ gần dừng, TTS sẽ giảm âm lượng dần trong vài giây rồi mới ngắt.
- **Tự cuộn** sẽ highlight/cuộn theo đoạn đang đọc; **Tự qua đoạn/chương** + **Tự đọc chương kế** cho phép phát tiếp sang chương sau.
- TikTok có popup nhập Cookie; Zalo có popup nhập một hoặc nhiều API key. Gemini cần đăng nhập gemini.google.com; Bing có thể cần mở bing.com/translator một lần nếu token hết hạn.
- Hướng dẫn TTS chi tiết: [HUONG_DAN_SU_DUNG_TTS_READER.md](https://github.com/BaoBao666888/Novel-Downloader5/blob/main/tools/HUONG_DAN_SU_DUNG_TTS_READER.md).
- **Tab Từ điển Local**: Tìm/sửa/xóa mục, khôi phục gốc.
- **Tab Blacklist**: Chặn domain không muốn script chạy.
- **Tab Nâng cao**: Provider dịch, delay, max ký tự, retry.
- **Tab OCR**: Action mode, nguồn ảnh, kiểu hiển thị, quản lý model.
    `.trim();

    const changelogMarkdown = `
### ✨ v3.5.5.8_beta
- Thư viện thêm reset CSS cục bộ để giảm bị style của web gốc ảnh hưởng khi mở danh sách truyện.
- Đổi **Sao lưu/Khôi phục** sang file \`.tmbackup.jsonl\`, dùng được trên mobile và không cần chọn thư mục.
- Backup ghi từng record theo lượt và nhả event loop định kỳ để hạn chế đơ khi thư viện lớn; restore đọc file theo stream khi trình duyệt hỗ trợ.
- Bỏ wrapper \`eval\` để tránh CSP \`unsafe-eval\` làm script chết trước khi hiện nút.

### 📦 Các bản trước (tóm tắt)
- v3.5.5.7: Thư viện fullscreen, grid có bìa, tìm kiếm theo phạm vi, lazy load danh sách, ưu tiên truyện vừa đọc và xuất EPUB/HTML có gợi ý theo dung lượng.
- v3.5.5.5 - v3.5.5.6: Reader mobile, thanh thao tác chọn text, sửa tên/thay thế từ/xóa rác, mini-player TTS, remote TTS prefetch, hẹn giờ ngủ và các nguồn Browser/TikTok/Google/Gemini/Bing/Zalo.
- v3.5.5 - v3.5.5.4: gom các sửa Reader, fullscreen, mục lục, tiến độ đọc, import/export thư viện, import TXT/EPUB, provider dịch và hotfix server.
- v3.5.0 - v3.5.4: Thư viện đọc offline, OCR vùng chọn, dịch local nâng cao, Shadow DOM UI, welcome/changelog và dọn giao diện.
- v3.3.x: Simplified view, tùy chỉnh giao diện đọc, blacklist domain.
    `.trim();

    function openHelpModal(contentHtml) {
        tmRemoveEl('tm-help-overlay');
        tmRemoveEl('tm-help-modal');

        const overlay = document.createElement('div');
        overlay.id = 'tm-help-overlay';
        overlay.className = 'tm-help-overlay';

        const modal = document.createElement('div');
        modal.id = 'tm-help-modal';
        modal.className = 'tm-help-modal';
        modal.innerHTML = `
            <div class="tm-help-header">
                <span>📖 TM Translate v${CURRENT_VERSION} — Hướng dẫn</span>
                <button class="tm-btn tm-help-close" id="tm-help-close-btn">✕ Đóng</button>
            </div>
            <div class="tm-help-content" id="tm-help-content"></div>
        `;

        tmUIRoot.appendChild(overlay);
        tmUIRoot.appendChild(modal);

        modal.querySelector('#tm-help-content').innerHTML = contentHtml || '';

        const closeHelp = () => { overlay.remove(); modal.remove(); };
        overlay.addEventListener('click', closeHelp);
        modal.querySelector('#tm-help-close-btn').addEventListener('click', closeHelp);
    }

    function openHelpModalFull() {
        openHelpModal([welcomeHtml, renderHelpMarkdown(guideMarkdown), '<div style="height:8px;"></div>', renderHelpMarkdown(changelogMarkdown)].join('\n'));
    }

    function openHelpModalUpdateOnly() {
        const updateBanner = `
	<div class="tm-update-banner">
	  <div style="font-size:15px;font-weight:700;">🌈 TM Translate v${CURRENT_VERSION} đã sẵn sàng!</div>
	  <div style="font-size:12px;color:#6a4f7a;">Sửa Thư viện chống dính CSS web, backup bằng file trên mobile và lỗi CSP của TTS core.</div>
	</div>`.trim();
        openHelpModal([updateBanner, renderHelpMarkdown(changelogMarkdown)].join('\n'));
    }

    /* ================== INIT ================== */

    if (checkBlacklistStatus()) {
        console.log('[tm-translate] Trang này nằm trong Blacklist. Script đã dừng hoạt động.');

        injectGlobalCSS();

        GM_registerMenuCommand('🚫 Mở Cài đặt (Bỏ chặn)', () => {
            openSettingsUI();
            setTimeout(() => {
                const blTab = tmUIRoot.querySelector('[data-tab="blacklist"]');
                if (blTab) blTab.click();
            }, 50);
        });

        return;
    }

    GM_registerMenuCommand('Dịch trang này', startTranslateAction);
    GM_registerMenuCommand('Bảng dịch nhanh', showQuickTranslatePanel);
    GM_registerMenuCommand('Dịch vùng chọn (OCR)', activateAreaSelectionMode);
    GM_registerMenuCommand('Thư viện (Beta)', openLibraryListModal);
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

    // Version check → show welcome/update popup
    setTimeout(() => {
        const storedVer = GM_getValue(TM_VERSION_KEY, null);
        if (!storedVer) {
            openHelpModalFull();
            GM_setValue(TM_VERSION_KEY, CURRENT_VERSION);
            return;
        }
        if (storedVer !== CURRENT_VERSION) {
            openHelpModalUpdateOnly();
            GM_setValue(TM_VERSION_KEY, CURRENT_VERSION);
        }
    }, 1200);

    console.log(`[tm-translate ${CURRENT_VERSION}] Đã tải thành công.`);

})();
