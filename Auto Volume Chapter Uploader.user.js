// ==UserScript==
// @name         Auto Volume/Chapter Uploader
// @namespace    http://tampermonkey.net/
// @version      1.1.6
// @description  Tự động hóa quá trình thêm/bổ sung chương trên wiki và web hồng
// @author       QuocBao
// @icon         data:image/x-icon;base64,AAABAAEAQEAAAAEAIAAoQgAAFgAAACgAAABAAAAAgAAAAAEAIAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAADaxiYA2sYmAdrGJnPaxibZ2sYm+9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJvzaxibf2sYmgNrGJgbaxiYA2sYmAtrGJpzaxib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axiaw2sYmCNrGJm3axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJn/axibd2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axibl2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axiT/2cUg/9jDG//Ywxr/2MMZ/9jDGf/Ywxr/2cQd/9rFIv/axiX/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJf/axSL/2cQd/9jDGv/Ywxn/2MMZ/9jDGf/Ywxv/2cQe/9rFI//axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cUi/9jDGv/Ywxr/28cp/+DORf/l12X/6dx6/+vgh//r4If/6Nt1/+PTVv/dyjT/2cQe/9jDGf/ZxB//2sYm/9rGJv/axib/2sYm/9rGJv/axiT/2cQd/9jDGf/ZxSD/3cs3/+PUWv/o3Hf/6+CH/+vgh//q3oH/5tls/+HRT//cyC7/2cQc/9jDGf/ZxSD/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxSD/2MMa/93LN//n2nL/8eqt//n23P/+/vr//////////////////////////////////Prs//Xvw//r4In/4M9G/9nEHf/ZxB3/2sYm/9rGJP/Ywxr/2sYm/+LTVf/t45L/9vHI//377v//////////////////////////////////////+/jk//PtuP/p3n//381B/9nEHP/ZxB7/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJf/Ywxj/3sw7/+/moP/9++7///////////////////////////////////////////////////////////////////////7++f/z7bf/4dFN/9jCF//axiX/6d16//j01f////////////////////////////////////////////////////////////////////////////799f/y67L/4M9I/9jDGP/axiT/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYn/9nFIf/ZxR//6d19//z77P/////////////////////////////////////////////////////////////////////////////////////////////++//w56T/9/LN//////////////////////////////////////////////////////////////////////////////////////////////////799v/s4Yr/2sYj/9nEH//axif/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYn/9nEH//byCz/8+yz//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////Xww//dyzj/2cQc/9rGJ//axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYn/9nEHv/cyS//9/LN//////////////////////////////////////////////////389P/7+OT/+PXX//n12P/8+un////9///////////////////////////////////////////////////////////////////////////////9//z66//59tz/+PTV//r33//8++7/////////////////////////////////////////////////+vji/+HQSf/Zwxv/2sYn/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nFIP/cyS//9/LN///////////////////////////////////////59tv/7eOS/+PUWv/ezDv/3Mgt/9rGJf/axib/3Mkx/+DQSf/p3Xr/9vHI//////////////////////////////////////////////////799f/z7LX/6Ntz/+DQSf/cyTL/28co/9rGJP/bxyr/3co1/+LSUP/r34X/9/PQ///////////////////////////////////////7+ej/385C/9nEHf/axif/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJP/ZxR//9O68//////////////////////////////////r44v/o23X/28co/9jCGP/ZxBz/2cUh/9rGI//axiX/2sYk/9rFI//ZxB//2MMY/9nFIP/k1V//9vLL/////////////////////////////v76/+/mnv/fzT//2MMb/9jDGf/ZxB//2sUj/9rGJP/axiX/2sYk/9rFIv/ZxB7/2MMY/9rFIv/l1mP/+fXX//////////////////////////////////n12P/byCv/2sUi/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxj/6t6B//////////////////////////////////Pstv/cyjL/2MMX/9rGJP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axiX/2MMa/9rFIv/r4Ib//fvv////////////+fXY/+LSUf/Ywxf/2cUf/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axiX/2MMZ/9vIKf/w6KX/////////////////////////////////8emr/9jDGv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxSD/380///788/////////////////////////////Hpqf/ZxB7/2cUg/9rGJ//axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axSH/2MMX//bwxf//////9e/A/9zJLf/Zwxv/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axSL/2MMa/+zhiv/////////////////////////////////m2Gf/2cQa/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMa//Hpqf////////////////////////////PstP/ZxB7/2sUi/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMZ/+3jkv//////9fDE/9rGJv/ZxR//2sYn/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJP/Ywxf/7uSW////////////////////////////+vfh/9vIKv/axiP/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sUh/97MO//+/fX///////////////////////r44f/cyS7/2cUg/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQc/+PTVf////7/+/jj/93KMv/ZxB7/2sYn/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYj/9nFHv/178H////////////////////////////p3Xv/2MMZ/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDGv/o3Hf////////////////////////////n2m//2MMY/9rGJ//axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYl/9rFIv/388///////+TWYP/Ywxn/2sYn/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/381A//388///////////////////////+PTS/9rFIv/axiX/2sYm/9rGJv/axib/2sYm/9rGJv/ZxBv/8+y2///////////////////////59tv/2sYm/9rGJP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axSP/2cUh/9rFIv/axiX/2sYm/9nEG//m12b///////Pstf/Ywxr/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sUj/9nFIf/ZxSL/2sYl/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDF//u5Zr//////////////////////////P/gz0j/2cUf/9rGJv/axib/2sYm/9rGJv/axiT/3Mgs//v45P//////////////////////7eKR/9jDGP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rFI//Ywxv/3Mkv/97MPv/dyzf/2cQf/9nEHv/ZxB3/9e/C///////h0U7/2cQd/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axiP/2MMa/9zILv/ezD7/3cs4/9nEH//ZxB7/2sYn/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxSD/381A//799v//////////////////////6d5+/9jDGf/axib/2sYm/9rGJv/axib/2cQe/+HRTv////7//////////////////////+LSU//ZxB3/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rFIv/bxyj/7uSW//v45P/+/fb//fvv//Tuu//fzkL/3co0///++//38sv/2cQe/9rGJf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axSL/28cn/+3jlP/7+OP//v32//378P/07r3/4dBK/9nEHP/axif/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHf/28MX///////////////////////Lrs//ZxBv/2sYm/9rGJv/axib/2sYm/9jDGv/o23b///////////////////////z67P/cyjL/2sYj/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJf/axSD/8+23////////////////////////////+/nl/+3jk///////6t5+/9jDGf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axiX/2cUg//PstP////////////////////////////377//gz0X/2cUf/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxj/7eKP///////////////////////59tz/28cn/9rGJP/axib/2sYm/9rGJv/Ywxn/7uSZ///////////////////////489D/2sUi/9rGJf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxBv/5tlr///////////////////////////////////////////////8/+HQSf/ZxR//2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQb/+bYaP//////////////////////////////////////9O69/9nEHf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bYaf///////////////////////fzz/97MOv/axSH/2sYm/9rGJv/axib/2MMb//LqsP//////////////////////9O26/9jDHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQe//XwxP////////////////////////////////////////////v55v/cyC3/2sYj/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHf/177/////////////////////////////////////////+/P/gz0f/2cUf/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHv/i01T///////////////////////7++//fzkT/2cUg/9rGJv/axib/2sYm/9nEHf/07r////////////////////////Dopv/Ywxn/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sUi/93LNv/9/PH////////////////////////////////////////////38s3/2sUh/9rGJf/axib/2sYm/9rGJv/axib/2sYm/9rFIv/dyjT//fvu////////////////////////////////////////////6dx5/9jDGv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/4tJT///////////////////////+/vr/385D/9nFIP/axib/2sYm/9rGJv/ZxB3/9O6////////////////////////v56H/2MMZ/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHv/i0lD/////////////////////////////////////////////////9O69/9nEHf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/4dFO/////////////////////////////////////////////////+/mnf/Ywxn/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQe/+LSU////////////////////////v76/9/OQ//ZxSD/2sYm/9rGJv/axib/2cQd//Tuv///////////////////////7+ei/9jDGf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxBz/5ddl//////////////////////////////////////////////////Ptuf/ZxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQc/+XWY//////////////////////////////////////////////////z7LX/2cQb/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHv/i0lP///////////////////////7++v/fzkP/2cUg/9rGJv/axib/2sYm/9nEHf/07r///////////////////////+/nov/Ywxn/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bZa//////////////////////////////////////////////////z7bn/2MQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//n2Gn/////////////////////////////////////////////////9e68/9nEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/4tJT///////////////////////+/vr/385D/9nFIP/axib/2sYm/9rGJv/ZxB3/9O6////////////////////////v56L/2MMZ/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m2Gr/////////////////////////////////////////////////8+25/9jEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5tdo//////////////////////////////////////////////////Ttu//ZxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQe/+LSU////////////////////////v76/9/OQ//ZxSD/2sYm/9rGJv/axib/2cQd//Tuv///////////////////////7+ei/9jDGf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5thq//////////////////////////////////////////////////Ptuf/YxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bXaP/////////////////////////////////////////////////07bv/2cQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHv/i0lP///////////////////////7++v/fzkP/2cUg/9rGJv/axib/2sYm/9nEHf/07r///////////////////////+/nov/Ywxn/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bYav/////////////////////////////////////////////////z7bn/2MQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m12j/////////////////////////////////////////////////9O27/9nEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/4tJT///////////////////////+/vr/385D/9nFIP/axib/2sYm/9rGJv/ZxB3/9O6////////////////////////v56L/2MMZ/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m2Gr/////////////////////////////////////////////////8+25/9jEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5tdo//////////////////////////////////////////////////Ttu//ZxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQe/+LSU////////////////////////v76/9/OQ//ZxSD/2sYm/9rGJv/axib/2cQd//Tuv///////////////////////7+ei/9jDGf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5thq//////////////////////////////////////////////////Ptuf/YxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bXaP/////////////////////////////////////////////////07bv/2cQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHv/i0lP///////////////////////7++v/fzkP/2cUg/9rGJv/axib/2sYm/9nEHf/07r///////////////////////+/nov/Ywxn/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bYav/////////////////////////////////////////////////z7bn/2MQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m12j/////////////////////////////////////////////////9O27/9nEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/4tJT///////////////////////+/vr/385D/9nFIP/axib/2sYm/9rGJv/ZxB3/9O6////////////////////////v56L/2MMZ/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m2Gr/////////////////////////////////////////////////8+25/9jEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5tdo//////////////////////////////////////////////////Ttu//ZxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQe/+LSU////////////////////////v76/9/OQ//ZxSD/2sYm/9rGJv/axib/2cQd//Tuv///////////////////////7+ei/9jDGf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5thq//////////////////////////////////////////////////Ptuf/YxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bXaP/////////////////////////////////////////////////07bv/2cQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHv/i0lP///////////////////////7++v/fzkP/2cUg/9rGJv/axib/2sYm/9nEHf/07r///////////////////////+/nov/Ywxn/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bYav/////////////////////////////////////////////////z7bn/2MQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m12j/////////////////////////////////////////////////9O27/9nEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/4tJT///////////////////////+/vr/385D/9nFIP/axib/2sYm/9rGJv/ZxB3/9O6////////////////////////v56L/2MMZ/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m2Gr/////////////////////////////////////////////////8+25/9jEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5tdo//////////////////////////////////////////////////Ttu//ZxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQe/+LSU////////////////////////v76/9/OQ//ZxSD/2sYm/9rGJv/axib/2cQd//Tuv///////////////////////7+ei/9jDGf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5thq//////////////////////////////////////////////////Ptuf/YxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bXaP/////////////////////////////////////////////////07bv/2cQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHv/i0lP///////////////////////7++v/fzkP/2cUg/9rGJv/axib/2sYm/9nEHf/07r///////////////////////+/nov/Ywxn/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bYav/////////////////////////////////////////////////z7bn/2MQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m12j/////////////////////////////////////////////////9O27/9nEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/4tJT///////////////////////+/vr/385D/9nFIP/axib/2sYm/9rGJv/ZxB3/9O6////////////////////////v56L/2MMZ/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m2Gr/////////////////////////////////////////////////8+25/9jEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5tdo//////////////////////////////////////////////////Ttu//ZxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQe/+LSU////////////////////////v76/9/OQ//ZxSD/2sYm/9rGJv/axib/2cQd//Tuv///////////////////////7+ei/9jDGP/axiX/2sYl/9rGJf/axiX/2sYl/9rGJf/Ywxr/5thq//////////////////////////////////////////////////Ptuf/YxBv/2sYl/9rGJf/axiX/2sYl/9rGJf/axiX/2MMa/+bXaP/////////////////////////////////////////////////07bv/2cQb/9rGJf/axiX/2sYl/9rGJf/axiX/2sYl/9nEHf/i0lP///////////////////////7++v/fzkP/2cUg/9rGJv/axib/2sYm/9nEHf/078D//////////////////////+/mn//XwRL/2cQf/9nEH//ZxB//2cQf/9nEH//ZxB//18EU/+XXZv/////////////////////////////////////////////////z7bf/18IV/9nEH//ZxB//2cQf/9nEH//ZxB//2cQf/9fBFP/l1mP/////////////////////////////////////////////////9O25/9jCFf/ZxB//2cQf/9nEH//ZxB//2cQf/9nEH//Ywhf/4dFO///////////////////////+/vv/385E/9nFIP/axib/2sYm/9rGJv/ZxBz/8+25///////////////////////7+ej/9fDE//bxyP/28cj/9vHI//bxyP/28cj/9vHI//Xwxf/59dn//////////////////////////////////////////////////Pvt//Xwxf/28cj/9vHI//bxyP/28cj/9vHI//bxyP/18MX/+fXZ//////////////////////////////////////////////////z77v/28MX/9vHI//bxyP/28cj/9vHI//bxyP/28cj/9vDG//j00////////////////////////v73/9/NP//ZxSH/2sYm/9rGJv/axib/2MMZ/+zijf/////////////////////////////////////////////////////////////////////////////////////////////////+/ff//////////////////////////////////////////////////////////////////////////////////////////////////v33//////////////////////////////////////////////////////////////////////////////////////////////////n22//bxib/2sYk/9rGJv/axib/2sYm/9nEHv/i0U/////+////////////////////////////////////////////////////////////////////////////////////////////7eOT//z66////////////////////////////////////////////////////////////////////////////////////////////+7klv/7+eb////////////////////////////////////////////////////////////////////////////////////////////v5pz/2MMa/9rGJv/axib/2sYm/9rGJv/axib/2cQb/+3klf//////////////////////////////////////////////////////////////////////////////////////9fDD/9jDGf/p3Xz///////////////////////////////////////////////////////////////////////////////////////bxyP/ZxBv/6Nt1///////////////////////////////////////////////////////////////////////////////////////59tr/3Mkv/9rFIv/axib/2sYm/9rGJv/axib/2sYm/9rGJP/axSH/6+CJ//378P///////////////////////////////////////////////////////////////////vz/8uqu/9zILv/ZxSD/2cQd/+ncef/8+uz////////////////////////////////////////////////////////////////////9//Lqr//cyS//2cUg/9nEHf/o3Hj//Prr/////////////////////////////////////////////////////////////////////v/07rv/3sw5/9nEHv/axif/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYk/9jDG//ezDv/5thp/+3jkv/u5Jj/7uSY/+7kmP/u5Jj/7uSY/+7kmP/u5Jj/7uSY/+7kl//o3Hj/4M9I/9nEH//axSH/2sYn/9rGJf/Ywxv/3cs3/+XXZ//t45H/7uSY/+7kmP/u5Jj/7uSY/+7kmP/u5Jj/7uSY/+7kmP/u5Jf/6dx6/+DQSv/ZxB//2cUh/9rGJ//axiX/2MMb/93LNv/l12X/7eKQ/+7kmP/u5Jj/7uSY/+7kmP/u5Jj/7uSY/+7kmP/u5Jj/7uSY/+ndfP/h0Ez/2sUi/9nFH//axif/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cUh/9jDG//Ywxn/2MMZ/9jDGf/Ywxn/2MMZ/9jDGf/Ywxn/2MMZ/9jDGf/Ywxn/2MMa/9nEH//axiX/2sYm/9rGJv/axib/2sYm/9rFIv/Ywxv/2MMZ/9jDGf/Ywxn/2MMZ/9jDGf/Ywxn/2MMZ/9jDGf/Ywxn/2MMZ/9jDGv/ZxB//2sYl/9rGJv/axib/2sYm/9rGJv/axSL/2cQc/9jDGf/Ywxn/2MMZ/9jDGf/Ywxn/2MMZ/9jDGf/Ywxn/2MMZ/9jDGf/Ywxr/2cQf/9rGJf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv7axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv7axibW2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axibf2sYmX9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYmcdrGJgDaxiaH2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYmnNrGJgPaxiYA2sYmANrGJmHaxibR2sYm+trGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJvzaxibX2sYmb9rGJgDaxiYAgAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAwAAAAAAAAAM=
// @downloadURL  https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/Auto%20Volume%20Chapter%20Uploader.user.js
// @updateURL    https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/Auto%20Volume%20Chapter%20Uploader.user.js
// @require      https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/Wikidich_Autofill.user.js?v=0.3.0
// @match        https://truyenwikidich.net/nhung-file
// @match        https://truyenwikidich.net/truyen/*/chinh-sua
// @match        https://koanchay.org/nhung-file
// @match        https://koanchay.org/truyen/*/chinh-sua
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @connect      api5-normal-sinfonlineb.fqnovel.com
// @connect      app.jjwxc.net
// @connect      po18.tw
// @connect      ihuaben.com
// @connect      qidian.com
// @connect      qimao.com
// @connect      gongzicp.com
// @connect      generativelanguage.googleapis.com
// @connect      dichngay.com
// @connect      fanqiesdkpic.com
// @connect      *
// ==/UserScript==

(function () {
    'use strict';
    const { hostname, pathname } = window.location;
    const parts = pathname.split('/').filter(p => p.length > 0);
    if (parts[0] === 'truyen' && parts.at(-1) === 'chinh-sua') {
        const count = parts.length; // độ dài mảng
        if (count === 4) {
            console.log('[WDU] Trang chỉnh sửa CHƯƠNG → không chạy script.');
            return;
        }
    }
    // --- Cấu hình ---
    const APP_PREFIX = 'WDU_';
    let settings = {
        LOG_MAX_LINES: 1000,
        FILE_SIZE_WARNING_KB: 4,
        USE_FIRST_LINE_ONLY: false,
        FILENAME_REGEX: String.raw`第(\d+)章\s*(.*)`,
        CONTENT_REGEX: String.raw`第(\d+)章\s*(.*)`,
        CHAPTER_NAME_TEMPLATE: '第{num}章 {title}',
        PARSE_PRIORITY: 'filename',
    };
    const SETTINGS_KEY = `${APP_PREFIX}settings`;

    // --- Trạng thái của Script ---
    let state = {
        isEditPage: /^\/truyen\/[^\/]+\/chinh-sua$/.test(location.pathname),
        isNewBookPage: /^\/nhung-file$/.test(location.pathname),
        selectedVolumeWrapper: null,
        allFiles: [],
        validFiles: [],
        invalidFiles: [],
    };

    // --- Tạo UI trong Shadow DOM để tránh xung đột CSS ---
    const shadowHost = document.createElement('div');
    shadowHost.id = `${APP_PREFIX}host`;
    document.body.appendChild(shadowHost);
    const shadowRoot = shadowHost.attachShadow({ mode: 'open' });

    // --- CSS cho giao diện ---
    const css = `
        :host {
            all: initial;
        }
        #${APP_PREFIX}panel {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 350px;
            max-height: 450px;
            background-color: #f9f9f9;
            border: 1px solid #ccc;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 99999;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            font-size: 14px;
            color: #333;
            display: flex;
            flex-direction: column;
        }
        #${APP_PREFIX}header {
            padding: 10px 15px;
            background-color: #f1f1f1;
            border-bottom: 1px solid #ddd;
            font-size: 16px;
            font-weight: bold;
            cursor: move;
            border-top-left-radius: 8px;
            border-top-right-radius: 8px;
        }
        #${APP_PREFIX}content {
            padding: 15px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        #${APP_PREFIX}log-container {
            background-color: #1a1a1a;
            color: #0f0;
            font-family: 'Courier New', Courier, monospace;
            font-size: 12px;
            height: 200px;
            overflow-y: scroll;
            padding: 10px;
            border-radius: 4px;
            border: 1px solid #444;
            margin-top: 10px;
        }
        #${APP_PREFIX}log-container div {
            margin-bottom: 5px;
            white-space: pre-wrap;
            overflow-wrap: break-word; /* Tùy chọn ngắt từ hiện đại */
            word-wrap: break-word;     /* Tương thích ngược */
        }
        .${APP_PREFIX}log-time { color: #888; margin-right: 5px; }
        .${APP_PREFIX}log-warn { color: #ffc107; }
        .${APP_PREFIX}log-error { color: #f44336; }
        .${APP_PREFIX}log-success { color: #4CAF50; }
        .${APP_PREFIX}btn {
            background-color: #ff9800;
            color: white !important;
            border: none;
            padding: 10px 15px;
            text-align: center;
            text-decoration: none;
            display: inline-block;
            font-size: 14px;
            margin: 4px 0;
            cursor: pointer;
            border-radius: 4px;
            width: 100%;
            box-sizing: border-box;
            font-weight: bold;
        }
        .${APP_PREFIX}btn:hover { background-color: #fb8c00; }
        .${APP_PREFIX}btn:disabled { background-color: #9e9e9e; cursor: not-allowed; }
        .${APP_PREFIX}btn-autofill {
            position: relative;
            background-color: #2196f3;
        }
        .${APP_PREFIX}btn-autofill:hover { background-color: #1e88e5; }
        .${APP_PREFIX}autofill-icon {
            width: 18px;
            height: 18px;
            margin-right: 6px;
            vertical-align: -3px;
            filter: drop-shadow(0 0 4px rgba(130, 200, 255, 0.8));
        }
        .${APP_PREFIX}autofill-icon .${APP_PREFIX}lens {
            fill: none;
            stroke: rgba(220, 245, 255, 0.9);
            stroke-width: 1.8;
        }
        .${APP_PREFIX}autofill-icon .${APP_PREFIX}spark {
            fill: none;
            stroke: rgba(255, 255, 255, 0.9);
            stroke-width: 1.4;
            stroke-linecap: round;
            animation: ${APP_PREFIX}sparkle-stroke 1.6s ease-in-out infinite;
        }
        .${APP_PREFIX}btn-autofill::before {
            content: "";
            position: absolute;
            inset: -6px;
            border-radius: 6px;
            border: 2px solid rgba(33, 150, 243, 0.7);
            box-shadow: 0 0 8px rgba(33, 150, 243, 0.7);
            animation: ${APP_PREFIX}sparkle 1.8s ease-in-out infinite;
            pointer-events: none;
        }
        .${APP_PREFIX}beta {
            position: absolute;
            right: -6px;
            bottom: -6px;
            background: #ffeb3b;
            color: #1a1a1a;
            font-size: 10px;
            font-weight: bold;
            padding: 2px 6px;
            border-radius: 999px;
            border: 1px solid #f5c400;
            text-transform: uppercase;
        }
        @keyframes ${APP_PREFIX}sparkle {
            0% { transform: scale(1); opacity: 0.7; }
            50% { transform: scale(1.04); opacity: 1; }
            100% { transform: scale(1); opacity: 0.7; }
        }
        @keyframes ${APP_PREFIX}sparkle-stroke {
            0% { opacity: 0.6; }
            50% { opacity: 1; }
            100% { opacity: 0.6; }
        }
        .${APP_PREFIX}select, .${APP_PREFIX}text-input {
            width: 100%;
            padding: 8px;
            margin-bottom: 5px;
            border: 1px solid #ccc;
            border-radius: 4px;
            background-color: white;
            color: #333;
            box-sizing: border-box;
            font-family: inherit;
            font-size: 13px;
        }
        .${APP_PREFIX}notice {
            font-size: 12px;
            color: #555;
            margin-top: 5px;
            line-height: 1.4;
        }
        #${APP_PREFIX}manual-input {
            border-top: 1px dashed #ccc;
            padding-top: 10px;
            margin-top: 10px;
        }
        .${APP_PREFIX}manual-file-entry {
            margin-bottom: 8px;
            padding: 5px;
            background: #eee;
            border-radius: 4px;
        }
        .${APP_PREFIX}manual-file-entry label {
            font-size: 12px;
            font-weight: bold;
            display: block;
            margin-bottom: 3px;
            color: #d9534f;
        }
        .${APP_PREFIX}button-group {
            display: flex;
            gap: 10px;
        }
        #${APP_PREFIX}settings-btn {
            background: none;
            border: none;
            padding: 0 5px;
            margin: 0;
            cursor: pointer;
            color: #555;
            line-height: 1;
        }
        #${APP_PREFIX}settings-btn:hover {
            color: #000;
        }
        #${APP_PREFIX}help-btn {
            background: none;
            border: none;
            padding: 0 5px;
            margin: 0;
            cursor: pointer;
            color: #555;
            line-height: 1;
            font-weight: bold;
        }
        #${APP_PREFIX}help-btn:hover {
            color: #000;
        }
        #${APP_PREFIX}minimize-btn {
            background: none;
            border: none;
            padding: 0 5px;
            margin: 0;
            cursor: pointer;
            color: #555;
            line-height: 1;
            font-weight: bold;
        }
        #${APP_PREFIX}minimize-btn:hover {
            color: #000;
        }

        .${APP_PREFIX}hide {
            display: none !important;
        }

        #${APP_PREFIX}floating-icon {
            position: fixed;
            right: 20px;
            bottom: 20px;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: #ff9800;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 6px 18px rgba(0,0,0,0.2);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            font-size: 16px;
            font-weight: bold;
            cursor: move;
            z-index: 99999;
            user-select: none;
        }
        #${APP_PREFIX}floating-icon span {
            pointer-events: none;
        }

        #${APP_PREFIX}settings-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background-color: rgba(0,0,0,0.5);
            z-index: 100000;
        }

        #${APP_PREFIX}settings-modal {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 420px;
            max-height: 80vh;
            background: #fff;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            z-index: 100001;
            display: flex;
            flex-direction: column;
            color: #333;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            font-size: 14px;
        }
        .${APP_PREFIX}modal-header {
            padding: 12px 15px;
            font-size: 16px;
            font-weight: bold;
            border-bottom: 1px solid #e5e5e5;
            flex: 0 0 auto;
        }
        .${APP_PREFIX}modal-content {
            padding: 15px;
            display: flex;
            flex-direction: column;
            gap: 15px;
            flex: 1 1 auto;
            overflow-y: auto;
        }
        .${APP_PREFIX}setting-item label {
            font-weight: bold;
            display: block;
            margin-bottom: 5px;
        }
        .${APP_PREFIX}setting-item .${APP_PREFIX}text-input {
            margin-bottom: 3px;
        }
        .${APP_PREFIX}modal-footer {
            padding: 10px 15px;
            border-top: 1px solid #e5e5e5;
            display: flex;
            gap: 10px;
            justify-content: flex-end;
            flex: 0 0 auto;
            background-color: #fff;
            border-bottom-left-radius: 8px;
            border-bottom-right-radius: 8px;
        }
        .${APP_PREFIX}modal-footer .${APP_PREFIX}btn {
            width: auto;
            margin: 0;
        }

        #${APP_PREFIX}help-modal {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 640px;
            max-width: 92vw;
            max-height: 82vh;
            background: #fff;
            border-radius: 10px;
            box-shadow: 0 8px 20px rgba(0,0,0,0.35);
            z-index: 100002;
            display: flex;
            flex-direction: column;
            color: #222;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            font-size: 14px;
        }
        #${APP_PREFIX}help-header {
            padding: 12px 16px;
            font-size: 16px;
            font-weight: bold;
            border-bottom: 1px solid #eee;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        #${APP_PREFIX}help-content {
            padding: 14px 16px;
            overflow-y: auto;
            line-height: 1.55;
        }
        #${APP_PREFIX}help-content h3 {
            margin: 12px 0 6px;
            font-size: 15px;
            color: #0b5394;
        }
        #${APP_PREFIX}help-content code {
            background: #f5f5f5;
            padding: 1px 4px;
            border-radius: 4px;
        }
        #${APP_PREFIX}help-content ul {
            padding-left: 20px;
            margin: 6px 0 12px;
        }
    `;

    // --- HTML cho giao diện ---
    const panelHTML = `
        <style>${css}</style>
        <div id="${APP_PREFIX}floating-icon">
            <span>WDU</span>
        </div>
        <div id="${APP_PREFIX}panel">
            <div id="${APP_PREFIX}header">
                Auto Uploader v1.0
                <button id="${APP_PREFIX}settings-btn" title="Cài đặt">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18px" height="18px"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.58-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.49.49 0 0 0-.49-.41h-3.84a.49.49 0 0 0-.49.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 0 0-.58.22L2.73 9.42a.49.49 0 0 0 .12.61l2.03 1.58c-.05.3-.07.61-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.2.37.29.58.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54a.49.49 0 0 0 .49.41h3.84c.27 0 .49-.18.49-.41l.36-2.54c.59-.24 1.13-.57 1.62-.94l2.39.96c.21.08.47 0 .58-.22l1.92-3.32a.49.49 0 0 0-.12-.61l-2.03-1.58zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/></svg>
                </button>
                <button id="${APP_PREFIX}help-btn" title="Hướng dẫn">?</button>
                <button id="${APP_PREFIX}minimize-btn" title="Thu nhỏ">✕</button>
            </div>
            <div id="${APP_PREFIX}content">
                <div id="${APP_PREFIX}controls">
                    <label for="${APP_PREFIX}volume-select"><b>1. Chọn Quyển:</b></label>
                    <select id="${APP_PREFIX}volume-select" class="${APP_PREFIX}select">
                        <option value="-1" disabled selected>-- Chọn quyển để thêm chương --</option>
                    </select>
                    <button id="${APP_PREFIX}upload-btn" class="${APP_PREFIX}btn" disabled>2. Chọn Files TXT</button>
                    <button id="${APP_PREFIX}fake-upload" class="${APP_PREFIX}btn">→ Ấn nút Tải lên (web)</button>
                    <button id="${APP_PREFIX}autofill-btn" class="${APP_PREFIX}btn ${APP_PREFIX}btn-autofill">
                        <svg class="${APP_PREFIX}autofill-icon" viewBox="0 0 24 24" aria-hidden="true">
                            <circle class="${APP_PREFIX}lens" cx="11" cy="11" r="6"></circle>
                            <line class="${APP_PREFIX}lens" x1="15.5" y1="15.5" x2="21" y2="21"></line>
                            <path class="${APP_PREFIX}spark" d="M6 5 L7 7 L9 8 L7 9 L6 11 L5 9 L3 8 L5 7 Z"></path>
                        </svg>
                        Autofill Thông tin<span class="${APP_PREFIX}beta">beta</span>
                    </button>

                    <p class="${APP_PREFIX}notice">
                        Tên file phải có dạng: 第123章...</strong> hoặc tùy chỉ nâng cao trong Setting. Script sẽ tự động sắp xếp, điền tên và số file.
                    </p>
                    <div id="${APP_PREFIX}manual-input" style="display: none;"></div>
                </div>
                <div id="${APP_PREFIX}log-container"></div>
            </div>
        </div>
        <div id="${APP_PREFIX}settings-overlay" class="${APP_PREFIX}hide"></div>
        <div id="${APP_PREFIX}help-modal" class="${APP_PREFIX}hide">
            <div id="${APP_PREFIX}help-header">
                <span>Hướng dẫn Auto Volume/Chapter Uploader</span>
                <button id="${APP_PREFIX}help-close" class="${APP_PREFIX}btn" style="background:#757575;">Đóng</button>
            </div>
            <div id="${APP_PREFIX}help-content"></div>
        </div>
        <div id="${APP_PREFIX}settings-modal" class="${APP_PREFIX}hide">
            <div class="${APP_PREFIX}modal-header">Cài đặt</div>
            <div class="${APP_PREFIX}modal-content">
                <div class="${APP_PREFIX}setting-item">
                    <label for="${APP_PREFIX}setting-log-max">Giới hạn dòng log:</label>
                    <input type="number" id="${APP_PREFIX}setting-log-max" class="${APP_PREFIX}text-input">
                    <span class="${APP_PREFIX}notice">Tránh lag nếu log quá nhiều. (Mặc định: 100)</span>
                </div>
                <div class="${APP_PREFIX}setting-item">
                    <label for="${APP_PREFIX}setting-file-kb">Cảnh báo file nhỏ (KB):</label>
                    <input type="number" id="${APP_PREFIX}setting-file-kb" class="${APP_PREFIX}text-input">
                    <span class="${APP_PREFIX}notice">Cảnh báo nếu file nhỏ hơn X KB. (Mặc định: 4)</span>
                </div>

                <div class="${APP_PREFIX}setting-item" style="margin-top: 10px; border-top: 1px dashed #ccc; padding-top: 10px;">
                    <label>
                        <input type="checkbox" id="${APP_PREFIX}setting-first-line-only">
                        File tên số, dùng dòng đầu làm tiêu đề (bỏ parse số)
                    </label>
                    <span class="${APP_PREFIX}notice">
                        Sắp xếp theo tên file (000, 001...), lấy thẳng dòng đầu để điền tên chương.
                    </span>
                </div>

                <div class="${APP_PREFIX}setting-item" style="margin-top: 10px; border-top: 1px dashed #ccc; padding-top: 10px;">
                    <label for="${APP_PREFIX}setting-priority">Ưu tiên lấy thông tin từ:</label>
                    <select id="${APP_PREFIX}setting-priority" class="${APP_PREFIX}select">
                        <option value="filename">Tên File (Fallback -> Nội dung)</option>
                        <option value="content">Dòng đầu file (Fallback -> Tên File)</option>
                    </select>
                </div>

                <div class="${APP_PREFIX}setting-item">
                    <label for="${APP_PREFIX}setting-encoding">Bảng mã file (Encoding):</label>
                    <select id="${APP_PREFIX}setting-encoding" class="${APP_PREFIX}select">
                        <option value="UTF-8">UTF-8 (Phổ biến nhất)</option>
                        <option value="GBK">GBK (Truyện Trung/Convert cũ)</option>
                        <option value="windows-1252">Windows-1252 (Tiếng Anh cũ)</option>
                        <option value="UTF-16">UTF-16</option>
                    </select>
                    <span class="${APP_PREFIX}notice">Đổi sang GBK nếu nội dung bị lỗi font dạng ♦.</span>
                </div>

                <div class="${APP_PREFIX}setting-item">
                    <label>
                        Regex Dòng đầu (Content):
                        <button type="button" id="${APP_PREFIX}setting-content-regex-test"
                                style="padding:2px 6px;font-size:11px;background:#2196F3;color:#fff;border:none;border-radius:3px;cursor:pointer;margin-left:5px;">
                            Test Content
                        </button>
                    </label>

                    <div style="display:flex;gap:6px;align-items:center;">
                        <input type="text" id="${APP_PREFIX}setting-content-regex" class="${APP_PREFIX}text-input"
                               placeholder="第(\d+)章\s*(.*)" style="margin-bottom:0;">
                    </div>

                    <input type="text" id="${APP_PREFIX}setting-content-sample" class="${APP_PREFIX}text-input"
                           placeholder="Ví dụ: 第188章 禅说"
                           style="
                                display:block;
                                opacity:0;
                                height:0;
                                padding:0 8px;
                                margin:0;
                                transition: all 0.25s ease;
                                overflow:hidden;
                                pointer-events:none;
                           ">

                    <div class="${APP_PREFIX}notice" id="${APP_PREFIX}setting-content-regex-result"></div>
                    <span class="${APP_PREFIX}notice">Nếu dòng đầu lỗi, sẽ tự dùng Tên file.</span>
                </div>
                <div class="${APP_PREFIX}setting-item">

                    <label for="${APP_PREFIX}setting-filename-regex">
                        Regex tên file (2 nhóm: num, title):
                        <button type="button"
                                id="${APP_PREFIX}setting-filename-regex-help"
                                style="margin-left:6px;border-radius:50%;border:1px solid #ccc;
                                    width:18px;height:18px;padding:0;font-size:11px;
                                    line-height:16px;background:#f5f5f5;cursor:pointer;">
                            ?
                        </button>
                        <button type="button" id="${APP_PREFIX}setting-filename-regex-test"
                                style="padding:2px 6px;font-size:11px;background:#2196F3;color:#fff;border:none;border-radius:3px;cursor:pointer;margin-left:5px;">
                            Test Filename
                        </button>
                    </label>

                    <div style="display:flex;gap:6px;align-items:center;">
                        <input type="text"
                            id="${APP_PREFIX}setting-filename-regex"
                            class="${APP_PREFIX}text-input"
                            placeholder="第(\\d+)章\\s*(.*)"
                            style="margin-bottom:0;">
                    </div>
                    <input type="text"
                    id="${APP_PREFIX}setting-filename-sample"
                    class="${APP_PREFIX}text-input"
                    placeholder="Ví dụ: 第188章 禅说.txt"
                    style="
                        display:block;
                        opacity:0;
                        height:0;
                        padding:0 8px;
                        margin:0;
                        transition: all 0.25s ease;
                        overflow:hidden;
                        pointer-events:none;
                    ">


                    <span class="${APP_PREFIX}notice">
                        Ví dụ Regex: <code>第(\\d+)章\\s*(.*)</code> → "第188章 禅说.txt"
                    </span>

                    <!-- Kết quả test -->
                    <div class="${APP_PREFIX}notice"
                        id="${APP_PREFIX}setting-filename-regex-test-result"></div>
                </div>

                <div class="${APP_PREFIX}setting-item">
                    <label for="${APP_PREFIX}setting-chapter-template">Mẫu tên chương:</label>
                    <input type="text" id="${APP_PREFIX}setting-chapter-template" class="${APP_PREFIX}text-input" placeholder="第{num}章 {title}">
                    <span class="${APP_PREFIX}notice">Ví dụ: <code>chương {num}: {title}</code> hoặc <code>{num}-{title}</code></span>
                </div>
            </div>
            <div class="${APP_PREFIX}modal-footer">
                <button id="${APP_PREFIX}settings-save" class="${APP_PREFIX}btn">Lưu</button>
                <button id="${APP_PREFIX}settings-cancel" class="${APP_PREFIX}btn" style="background-color: #757575;">Hủy</button>
            </div>
        </div>
    `;

    shadowRoot.innerHTML = panelHTML;

    // --- Kéo thả panel qua header ---
    // Lấy phần tử panel và header trong Shadow DOM
    const panelEl = shadowRoot.querySelector(`#${APP_PREFIX}panel`);
    const headerEl = shadowRoot.querySelector(`#${APP_PREFIX}header`);
    const floatingIconEl = shadowRoot.querySelector(`#${APP_PREFIX}floating-icon`);

    function enableDrag(panel, handle, storageKey) {
        const storagePosKey = storageKey || `${APP_PREFIX}panel_pos`;
        // --- HÀM CON: Kiểm tra xem panel có bị bay ra ngoài màn hình không ---
        const ensureOnScreen = () => {
            const rect = panel.getBoundingClientRect();
            const vw = window.innerWidth;
            const vh = window.innerHeight;

            // Nếu panel bay quá lề phải hoặc lề dưới
            // (Ví dụ: Left > chiều rộng màn hình - 50px)
            if (rect.left > vw - 50 || rect.top > vh - 50 || rect.left < 0 || rect.top < 0) {
                console.log('[WDU] Panel nằm ngoài vùng nhìn thấy -> Reset về mặc định.');
                // Reset về CSS mặc định (Góc dưới phải)
                panel.style.left = '';
                panel.style.top = '';
                panel.style.right = '20px';
                panel.style.bottom = '20px';
                // Xóa luôn lưu trữ bị lỗi
                localStorage.removeItem(storagePosKey);
                return;
            }
        };

        // 1. Khôi phục vị trí đã lưu
        try {
            const saved = JSON.parse(localStorage.getItem(storagePosKey) || 'null');
            if (saved && typeof saved.left === 'string' && typeof saved.top === 'string') {
                panel.style.left = saved.left;
                panel.style.top = saved.top;
                panel.style.right = 'auto';
                panel.style.bottom = 'auto';

                // Kiểm tra ngay sau khi khôi phục: Nếu vị trí cũ bị "lố", reset ngay
                // Phải setTimeout 0 để đợi DOM render xong mới lấy được kích thước thật
                setTimeout(ensureOnScreen, 0);
            }
        } catch { }

        // 2. Lắng nghe sự kiện thay đổi kích thước màn hình (Resize)
        // Để khi bạn thu nhỏ trình duyệt, cái bảng nó tự chạy theo vào trong
        window.addEventListener('resize', () => {
            // Lấy vị trí hiện tại
            const rect = panel.getBoundingClientRect();
            const vw = window.innerWidth;
            const vh = window.innerHeight;

            // Tính toán giới hạn mới
            let newLeft = rect.left;
            let newTop = rect.top;

            // Nếu vượt quá chiều rộng mới, ép nó sát lề phải
            if (newLeft + rect.width > vw) {
                newLeft = vw - rect.width - 10; // Cách lề 10px
            }
            // Nếu vượt quá chiều cao mới, ép nó sát lề dưới
            if (newTop + rect.height > vh) {
                newTop = vh - rect.height - 10;
            }

            // Cập nhật lại
            panel.style.left = Math.max(0, newLeft) + 'px';
            panel.style.top = Math.max(0, newTop) + 'px';
        });

        // --- Logic Kéo thả (Giữ nguyên, chỉ tối ưu một chút) ---
        let rect0 = null;
        let startX = 0, startY = 0;

        const onPointerDown = (e) => {
            if (e.target.closest(`#${APP_PREFIX}settings-btn`)) return;
            if (e.target.closest(`#${APP_PREFIX}help-btn`)) return;
            if (e.target.closest(`#${APP_PREFIX}minimize-btn`)) return;
            e.preventDefault();
            try { handle.setPointerCapture(e.pointerId); } catch { }
            handle.style.userSelect = 'none';

            rect0 = panel.getBoundingClientRect();
            startX = e.clientX;
            startY = e.clientY;

            panel.style.left = rect0.left + 'px';
            panel.style.top = rect0.top + 'px';
            panel.style.right = 'auto';
            panel.style.bottom = 'auto';

            const onPointerMove = (ev) => {
                const dx = ev.clientX - startX;
                const dy = ev.clientY - startY;
                const vw = window.innerWidth;
                const vh = window.innerHeight;
                const pw = rect0.width;
                const ph = rect0.height;

                // Giới hạn không cho kéo ra khỏi màn hình
                let newLeft = rect0.left + dx;
                let newTop = rect0.top + dy;

                // Ràng buộc biên (không cho < 0 hoặc > màn hình)
                newLeft = Math.max(0, Math.min(newLeft, vw - pw));
                newTop = Math.max(0, Math.min(newTop, vh - ph));

                panel.style.left = newLeft + 'px';
                panel.style.top = newTop + 'px';
            };

            const onPointerUp = (ev) => {
                try { handle.releasePointerCapture(ev.pointerId); } catch { }
                handle.removeEventListener('pointermove', onPointerMove);
                handle.removeEventListener('pointerup', onPointerUp);
                handle.style.userSelect = '';

                localStorage.setItem(storagePosKey, JSON.stringify({
                    left: panel.style.left,
                    top: panel.style.top
                }));
            };

            handle.addEventListener('pointermove', onPointerMove);
            handle.addEventListener('pointerup', onPointerUp);
        };

        handle.addEventListener('pointerdown', onPointerDown);
    }

    // Kích hoạt kéo–thả
    enableDrag(panelEl, headerEl, `${APP_PREFIX}panel_pos`);
    enableDrag(floatingIconEl, floatingIconEl, `${APP_PREFIX}icon_pos`);


    // --- Lấy các phần tử DOM (từ bên trong Shadow DOM) ---
    const logBox = shadowRoot.querySelector(`#${APP_PREFIX}log-container`);
    const uploadBtn = shadowRoot.querySelector(`#${APP_PREFIX}upload-btn`);
    const volumeSelect = shadowRoot.querySelector(`#${APP_PREFIX}volume-select`);
    const manualInputContainer = shadowRoot.querySelector(`#${APP_PREFIX}manual-input`);
    const autofillBtn = shadowRoot.querySelector(`#${APP_PREFIX}autofill-btn`);
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.txt';
    fileInput.multiple = true;

    // --- Biến cho Modal Cài đặt ---
    const settingsBtn = shadowRoot.querySelector(`#${APP_PREFIX}settings-btn`);
    const helpBtn = shadowRoot.querySelector(`#${APP_PREFIX}help-btn`);
    const minimizeBtn = shadowRoot.querySelector(`#${APP_PREFIX}minimize-btn`);
    const settingsOverlay = shadowRoot.querySelector(`#${APP_PREFIX}settings-overlay`);
    const settingsModal = shadowRoot.querySelector(`#${APP_PREFIX}settings-modal`);
    const helpModal = shadowRoot.querySelector(`#${APP_PREFIX}help-modal`);
    const helpCloseBtn = shadowRoot.querySelector(`#${APP_PREFIX}help-close`);
    const helpContent = shadowRoot.querySelector(`#${APP_PREFIX}help-content`);
    const settingsSaveBtn = shadowRoot.querySelector(`#${APP_PREFIX}settings-save`);
    const settingsCancelBtn = shadowRoot.querySelector(`#${APP_PREFIX}settings-cancel`);
    const logMaxInput = shadowRoot.querySelector(`#${APP_PREFIX}setting-log-max`);
    const fileSizeKbInput = shadowRoot.querySelector(`#${APP_PREFIX}setting-file-kb`);
    const firstLineOnlyInput = shadowRoot.querySelector(`#${APP_PREFIX}setting-first-line-only`);
    const filenameRegexInput = shadowRoot.querySelector(`#${APP_PREFIX}setting-filename-regex`);
    const filenameSampleInput = shadowRoot.querySelector(`#${APP_PREFIX}setting-filename-sample`);
    const chapterTemplateInput = shadowRoot.querySelector(`#${APP_PREFIX}setting-chapter-template`);

    const filenameRegexHelpBtn = shadowRoot.querySelector(`#${APP_PREFIX}setting-filename-regex-help`);
    const filenameRegexTestBtn = shadowRoot.querySelector(`#${APP_PREFIX}setting-filename-regex-test`);
    const filenameRegexTestResult = shadowRoot.querySelector(`#${APP_PREFIX}setting-filename-regex-test-result`);

    const prioritySelect = shadowRoot.querySelector(`#${APP_PREFIX}setting-priority`);
    const contentRegexInput = shadowRoot.querySelector(`#${APP_PREFIX}setting-content-regex`);
    const contentRegexTestBtn = shadowRoot.querySelector(`#${APP_PREFIX}setting-content-regex-test`);
    const contentSampleInput = shadowRoot.querySelector(`#${APP_PREFIX}setting-content-sample`);
    const contentRegexResult = shadowRoot.querySelector(`#${APP_PREFIX}setting-content-regex-result`);

    let iconDragged = false;

    function showPanel() {
        panelEl.classList.remove(`${APP_PREFIX}hide`);
        floatingIconEl.classList.add(`${APP_PREFIX}hide`);
    }

    function hidePanel() {
        panelEl.classList.add(`${APP_PREFIX}hide`);
        floatingIconEl.classList.remove(`${APP_PREFIX}hide`);
    }

    function renderHelpMarkdown(md) {
        const safe = md
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        const lines = safe.split('\n');
        const htmlParts = [];
        let inList = false;

        const flushList = () => {
            if (inList) {
                htmlParts.push('</ul>');
                inList = false;
            }
        };

        lines.forEach((raw) => {
            const line = raw.trimEnd();
            if (line.startsWith('### ')) {
                flushList();
                htmlParts.push(`<h3>${line.slice(4)}</h3>`);
                return;
            }
            if (line.startsWith('- ')) {
                if (!inList) {
                    htmlParts.push('<ul>');
                    inList = true;
                }
                htmlParts.push(`<li>${line.slice(2)}</li>`);
                return;
            }
            if (line === '') {
                flushList();
                htmlParts.push('<div style="height:8px;"></div>');
                return;
            }
            flushList();
            htmlParts.push(`<div>${line}</div>`);
        });

        flushList();
        let html = htmlParts.join('\n');
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        return html;
    }

    const helpMarkdown = `
### Tổng quan
- Script hỗ trợ tự điền upload chương trên Wikidich/Koanchay.
- Có panel nổi, kéo thả được; bấm ✕ để thu nhỏ về icon tròn.
- Bấm icon tròn để mở lại panel.

### Luồng thao tác cơ bản
- Mở trang nhúng file hoặc chỉnh sửa truyện.
- **Chọn Quyển** cần bổ sung/chỉnh.
- Bấm **Chọn Files TXT** và chọn nhiều file.
- Script tự sắp xếp, kiểm tra, rồi điền tên chương + file.
- Bấm **→ Ấn nút Tải lên (web)** để nhấn nút upload thật.

### Cảnh báo file nhỏ
- Nếu file < ngưỡng KB sẽ cảnh báo trước khi tiếp tục.
- Có thể đặt ngưỡng = 0 để tắt cảnh báo.

### Chế độ "File tên số, dùng dòng đầu"
- Dùng cho file kiểu: 000.txt, 001.txt...
- Script **không parse số chương**, chỉ sắp xếp theo tên file.
- **Dòng đầu** của file sẽ được dùng làm **tên chương**.
- Không check trùng/thiếu chương và không điền mô tả bổ sung.

### Regex & ưu tiên parse (mặc định)
- **Ưu tiên lấy thông tin từ**:
  - Tên file (fallback dòng đầu) hoặc Dòng đầu (fallback tên file).
- Regex phải có **2 nhóm**: num + title.
- Ví dụ: \`第(\\d+)章\\s*(.*)\` hoặc \`(\\d+)-(.*)\`.
- Mẫu tên chương: \`第{num}章 {title}\`.

### Khi có lỗi parse
- Script sẽ liệt kê file lỗi và cho phép chèn thủ công.
- Bạn có thể **tiếp tục** hoặc **hủy** nếu thấy không ổn.

### Tips
- Đổi encoding sang GBK nếu nội dung bị lỗi font.
- Nếu thiếu nút upload, thử reload trang.
    `.trim();

    function openHelpModal() {
        helpContent.innerHTML = renderHelpMarkdown(helpMarkdown);
        settingsOverlay.classList.remove(`${APP_PREFIX}hide`);
        helpModal.classList.remove(`${APP_PREFIX}hide`);
    }

    function closeHelpModal() {
        helpModal.classList.add(`${APP_PREFIX}hide`);
        settingsOverlay.classList.add(`${APP_PREFIX}hide`);
    }
    function setParseControlsEnabled(enabled) {
        const fields = [
            prioritySelect,
            contentRegexInput,
            contentRegexTestBtn,
            contentSampleInput,
            filenameRegexInput,
            filenameRegexHelpBtn,
            filenameRegexTestBtn,
            filenameSampleInput,
            chapterTemplateInput
        ];
        fields.forEach((el) => {
            if (!el) return;
            el.disabled = !enabled;
            el.style.opacity = enabled ? '' : '0.6';
        });
    }


    // --- Chức năng Ghi log ---
    const log = (message, type = 'info') => {
        const now = new Date().toLocaleTimeString('vi-VN');
        const logEntry = document.createElement('div');
        logEntry.className = `${APP_PREFIX}log-entry ${APP_PREFIX}log-${type}`;
        logEntry.innerHTML = `<span class="${APP_PREFIX}log-time">[${now}]</span> ${message}`;
        logBox.appendChild(logEntry);

        while (logBox.children.length > settings.LOG_MAX_LINES) {
            logBox.removeChild(logBox.firstElementChild);
        }
        logBox.scrollTop = logBox.scrollHeight;

        if (type === 'error') console.error(`[Uploader] ${message}`);
        else if (type === 'warn') console.warn(`[Uploader] ${message}`);
        else console.log(`[Uploader] ${message}`);
    };

    function installFormDataPatch() {
        const script = document.createElement('script');
        script.textContent = `
(function () {
  if (window.__WDU_FORMDATA_PATCHED) return;
  window.__WDU_FORMDATA_PATCHED = true;
  var origAppend = FormData.prototype.append;
  FormData.prototype.append = function (name, value, filename) {
    if (name === 'noteCn') {
      try {
        var text = (value == null) ? '' : String(value).trim();
        if (text && !this.__wdu_desc_added) {
          origAppend.call(this, 'descCn', value);
          this.__wdu_desc_added = true;
        }
      } catch (e) {}
    }
    return origAppend.apply(this, arguments);
  };
})();
        `;
        (document.head || document.documentElement).appendChild(script);
        script.remove();
    }

    function setInputValue(input, value) {
        if (!input) return false;
        input.value = value == null ? '' : String(value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
    }

    function syncAppendDesc(wrapper, text) {
        if (!wrapper || !text) return false;
        let updated = false;
        const descCnInput = wrapper.querySelector('.append-last-volume input[name="descCn"]');
        if (descCnInput) {
            setInputValue(descCnInput, text);
            updated = true;
        }
        const form = wrapper.querySelector('form.form-volume-info');
        if (form) {
            let noteCnInput = form.querySelector('input[name="noteCn"]');
            if (!noteCnInput) {
                noteCnInput = document.createElement('input');
                noteCnInput.type = 'hidden';
                noteCnInput.name = 'noteCn';
                form.appendChild(noteCnInput);
            }
            setInputValue(noteCnInput, text);
            updated = true;
        }
        return updated;
    }

    function computeDescInfo() {
        const items = (state.previewOrder && state.previewOrder.length > 0) ? state.previewOrder : state.validFiles;
        const nums = [];
        for (const item of items || []) {
            const num = item && item.chapterNumber;
            if (typeof num === 'number' && !Number.isNaN(num)) nums.push(num);
        }
        if (nums.length > 0) {
            nums.sort((a, b) => a - b);
            return { text: `${nums[0]}-${nums[nums.length - 1]}`, guessed: false };
        }
        if (state.invalidFiles.length > 0 && state.validFiles.length === 0) {
            const firstInvalidFile = state.invalidFiles[0].file || state.invalidFiles[0];
            const firstInvalidMatch = firstInvalidFile && firstInvalidFile.name ? firstInvalidFile.name.match(/\d+/) : null;
            if (firstInvalidMatch) {
                return { text: `Từ ${firstInvalidMatch[0]}`, guessed: true };
            }
        }
        return { text: '', guessed: false };
    }

    // --- Hướng dẫn Regex ---
    if (filenameRegexHelpBtn) {
        filenameRegexHelpBtn.addEventListener('click', () => {
            alert(
                `Hướng dẫn Regex tên file:

• Regex phải có ÍT NHẤT 2 nhóm bắt ( ... ):
   1) Nhóm 1: số chương (num)
   2) Nhóm 2: tiêu đề chương (title)

Ví dụ thường dùng:
1. (\\d+)-(.*)
   Khớp: "001-Tiêu đề.txt"
   → num = 001, title = "Tiêu đề"

2. 第(\\d+)章\\s*(.*)
   Khớp: "第1章 Tiêu đề.txt"
   → num = 1, title = "Tiêu đề"

3. Chương\\s+(\\d+)\\s*-\\s*(.*)
   Khớp: "Chương 12 - Tiêu đề.txt"

Lưu ý:
- Không cần ghi phần .txt trong regex (script tự bỏ đuôi .txt).
- Có thể dùng nhiều trường hợp với dấu |, ví dụ:
  (\\d+)-(.*)|第(\\d+)章\\s*(.*)`
            );
        });
    }
    // --- Hàm test Regex với tên file ví dụ ---
    function runFilenameRegexTest() {
        if (!filenameRegexTestResult) return;

        filenameRegexTestResult.textContent = '';

        const pattern = (filenameRegexInput.value || '').trim();
        if (!pattern) {
            filenameRegexTestResult.textContent = '❌ Vui lòng nhập Regex trước.';
            return;
        }

        let re;
        try {
            re = new RegExp(pattern, 'i');
        } catch (e) {
            filenameRegexTestResult.textContent = '❌ Regex không hợp lệ: ' + e.message;
            return;
        }

        const sampleRaw = (filenameSampleInput && filenameSampleInput.value || '').trim();
        if (!sampleRaw) {
            filenameRegexTestResult.textContent =
                '❌ Vui lòng nhập tên file ví dụ (vd: 第188章 禅说.txt).';
            return;
        }

        // bỏ đuôi .txt nếu có
        const baseName = sampleRaw.replace(/\.txt$/i, '');
        const m = baseName.match(re);

        if (!m) {
            filenameRegexTestResult.textContent =
                `❌ Regex KHÔNG khớp với tên file này.\n` +
                `Tên đang test: "${sampleRaw}"`;
            return;
        }

        if (m.length < 3) {
            filenameRegexTestResult.textContent =
                `❌ Regex chỉ bắt được ${m.length - 1} nhóm (không đủ 2 nhóm num/title).\n` +
                `Hãy chắc chắn Regex có ít nhất 2 cặp ngoặc ( ... ).`;
            return;
        }

        // Hiển thị chi tiết các nhóm
        const lines = [];
        lines.push(`Tên file: "${sampleRaw}"`);
        lines.push(`Chuỗi match: "${m[0]}"`);
        lines.push(`- Nhóm 1 (num): ${m[1]}`);
        lines.push(`- Nhóm 2 (title): ${m[2] || ''}`);

        if (m.length > 3) {
            for (let i = 3; i < m.length; i++) {
                lines.push(`- Nhóm ${i}: ${m[i] || ''}`);
            }
        }

        filenameRegexTestResult.textContent =
            '✅ Regex khớp với tên file.\n' + lines.join('\n');
    }

    if (filenameRegexTestBtn) {
        filenameRegexTestBtn.addEventListener('click', () => {

            // Nếu ô đang ẩn → hiện nó
            if (filenameSampleInput && filenameSampleInput.style.opacity === '0') {

                // Hiện đẹp
                filenameSampleInput.style.height = '32px';
                filenameSampleInput.style.padding = '6px 8px';
                filenameSampleInput.style.margin = '6px 0';
                filenameSampleInput.style.opacity = '1';
                filenameSampleInput.style.pointerEvents = 'auto';

                filenameRegexTestResult.textContent = '💡 Nhập tên file ví dụ rồi bấm Test lần nữa.';
                filenameSampleInput.focus();
                return;
            }

            // Nếu đã hiện thì chạy test
            runFilenameRegexTest();
        });
    }

    if (contentRegexTestBtn) {
        contentRegexTestBtn.addEventListener('click', () => {
            // Kiểm tra trạng thái ẩn hiện bằng opacity giống hàm filename
            if (contentSampleInput.style.opacity === '0') {
                // Hiện lên
                contentSampleInput.style.height = '32px';
                contentSampleInput.style.padding = '6px 8px';
                contentSampleInput.style.margin = '6px 0';
                contentSampleInput.style.opacity = '1';
                contentSampleInput.style.pointerEvents = 'auto';

                contentSampleInput.focus();
                contentRegexResult.textContent = '💡 Nhập dòng đầu ví dụ rồi bấm Test lần nữa.';
                return;
            }

            // Chạy test
            const pattern = contentRegexInput.value.trim();
            const sample = contentSampleInput.value.trim();
            if (!pattern) { contentRegexResult.textContent = '❌ Chưa nhập Regex.'; return; }

            try {
                const re = new RegExp(pattern, 'i');
                const m = sample.match(re);
                if (m && m.length >= 2) {
                    contentRegexResult.innerHTML = `✅ <b>Num:</b> ${m[1]} | <b>Title:</b> ${m[2] || '(trống)'}`;
                } else {
                    contentRegexResult.textContent = '❌ Không khớp hoặc thiếu nhóm (num/title).';
                }
            } catch (e) {
                contentRegexResult.textContent = '❌ Regex lỗi: ' + e.message;
            }
        });
    }

    if (filenameRegexTestBtn) {
        filenameRegexTestBtn.addEventListener('click', runFilenameRegexTest);
    }


    // --- Fake Upload Button ---
    const fakeUploadBtn = shadowRoot.querySelector(`#${APP_PREFIX}fake-upload`);
    fakeUploadBtn.disabled = true;

    if (autofillBtn) {
        autofillBtn.addEventListener('click', () => {
            if (typeof window.WDA_InitAutofill !== 'function') {
                log('❌ Không tìm thấy module Autofill. Kiểm tra @require.', 'error');
                return;
            }
            const instance = window.WDA_InitAutofill({ showFloatingButton: false, openOnInit: true });
            if (!instance || !instance.open) {
                log('❌ Không thể khởi tạo Autofill.', 'error');
                return;
            }
            instance.open();
            log('🔎 Đã mở panel Autofill.', 'success');
        });
    }

    fakeUploadBtn.addEventListener("click", () => {
        const realBtn = document.querySelector("#btnGetInfo");

        if (!realBtn) {
            log("❌ Không tìm thấy nút Tải lên trên web!", "error");
            return;
        }

        if (state.selectedVolumeWrapper && !settings.USE_FIRST_LINE_ONLY) {
            const trueWrapper = state.selectedVolumeWrapper.querySelector('.volume-wrapper');
            if (trueWrapper) {
                const descInfo = computeDescInfo();
                if (descInfo.text) {
                    const synced = syncAppendDesc(trueWrapper, descInfo.text);
                    if (synced) {
                        log(`🔁 Đồng bộ mô tả${descInfo.guessed ? ' (dự đoán)' : ''}: ${descInfo.text}`);
                    } else {
                        log('⚠️ Không tìm thấy ô mô tả để đồng bộ.', 'warn');
                    }
                } else {
                    log('⚠️ Không tìm thấy số chương để đồng bộ mô tả.', 'warn');
                }
                const appendModeInput = trueWrapper.querySelector('input[name="appendMode"]');
                if (appendModeInput) {
                    setInputValue(appendModeInput, 'true');
                }
            }
        }

        log("⏳ Đang nhấn nút Tải lên thật trên web...", "warn");

        // Nhấn nút thật
        realBtn.click();

        log("✅ Đã nhấn nút Tải lên!", "success");
    });


    // --- Chức năng Cài đặt ---
    function saveSettings() {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
            log('✅ Đã lưu cài đặt.');
        } catch (e) {
            log('❌ Lỗi khi lưu cài đặt: ' + e.message, 'error');
        }
    }

    function loadSettings() {
        try {
            const saved = localStorage.getItem(SETTINGS_KEY);
            if (saved) {
                const loadedSettings = JSON.parse(saved);
                // Hợp nhất, ghi đè mặc định bằng cái đã lưu
                settings = { ...settings, ...loadedSettings };
                log('Tải cài đặt đã lưu.');
            }
        } catch (e) {
            log('⚠️ Lỗi khi tải cài đặt, dùng mặc định.', 'warn');
        }
    }

    // Tải cài đặt ngay khi script chạy
    loadSettings();
    installFormDataPatch();

    // --- Chức năng chính ---

    function rebuildVolumeOptions(defaultSelectStrategy = 'lastAppendable') {
        const wrappers = [...document.querySelectorAll('.volume-info-wrapper')];
        volumeSelect.innerHTML = '<option value="-1" disabled selected>-- Chọn quyển để thêm chương --</option>';

        let lastAppendableIndex = -1;

        wrappers.forEach((wrapper, index) => {
            if (index === wrappers.length - 1) return;
            const trueWrapper = wrapper.querySelector('.volume-wrapper');
            const nameEl = wrapper.querySelector('input[name="nameCn"]');

            let name = nameEl ? nameEl.value.trim() : `Quyển ${index + 1}`;
            const isAppendable = !!(trueWrapper && trueWrapper.getAttribute('data-append') === 'true');

            // Nhận biết quyển không thể bổ sung/chỉnh (giống logic trước)
            const descEl = wrapper.querySelector('.volume-name-desc');
            const descText = (descEl ? descEl.textContent : '').trim();
            const cannotModify =
                /không thể chỉnh sửa/i.test(descText) ||
                (!isAppendable && !wrapper.querySelector('[data-action="addChapterInfo"]') && !wrapper.querySelector('.form-chapter'));

            if (isAppendable) {
                name += ' (Bổ sung)';
                lastAppendableIndex = index;
            }

            const opt = document.createElement('option');
            opt.value = String(index);
            opt.textContent = `${index + 1}. ${name}`;
            opt.dataset.isAppendable = String(isAppendable);
            opt.dataset.cannotModify = String(!!cannotModify);

            if (cannotModify) {
                opt.disabled = true;
                opt.textContent += ' — Không thể bổ sung';
            }

            volumeSelect.appendChild(opt);
        });

        // Chọn mặc định sau khi rebuild
        if (defaultSelectStrategy === 'preserve' && state._prevSelectValue != null) {
            // cố gắng giữ nguyên selection cũ nếu còn tồn tại
            const exists = [...volumeSelect.options].some(o => o.value === state._prevSelectValue && !o.disabled);
            if (exists) volumeSelect.value = state._prevSelectValue;
        } else if (defaultSelectStrategy === 'lastAppendable' && state.isEditPage && lastAppendableIndex !== -1) {
            volumeSelect.value = String(lastAppendableIndex);
        }
    }
    // MỚI: sau khi người dùng đổi chọn → cập nhật wrapper đúng theo DOM hiện tại
    function handleVolumeChange() {
        const selectedOption = volumeSelect.options[volumeSelect.selectedIndex];
        if (!selectedOption || selectedOption.value === '-1' || selectedOption.disabled || selectedOption.dataset.cannotModify === 'true') {
            state.selectedVolumeWrapper = null;
            uploadBtn.disabled = true;
            log('⛔ Quyển này không thể bổ sung/chỉnh. Hãy chọn quyển khác.', 'warn');
            return;
        }

        // LẤY LẠI wrappers MỖI LẦN (tránh map sai khi DOM vừa đổi)
        const wrappers = document.querySelectorAll('.volume-info-wrapper');
        const selectedIndex = parseInt(selectedOption.value, 10);
        state.selectedVolumeWrapper = wrappers[selectedIndex];

        if (!state.selectedVolumeWrapper) {
            uploadBtn.disabled = true;
            log('❌ Không lấy được quyển đã chọn.', 'error');
            return;
        }

        const trueWrapper = state.selectedVolumeWrapper.querySelector('.volume-wrapper');
        const isAppendable = selectedOption.dataset.isAppendable === 'true';

        // Bỏ readonly để thao tác
        if (state.isEditPage && trueWrapper && trueWrapper.classList.contains('readonly')) {
            trueWrapper.classList.remove('readonly');
            log('🔓 Đã bỏ readonly của quyển.');
        }

        if (isAppendable) {
            // Quyển bổ sung → mở vùng append đúng quyển này
            const addButton = state.selectedVolumeWrapper.querySelector('.btn-add-volume[data-action="appendLastVolume"]');
            const appendSection = state.selectedVolumeWrapper.querySelector('.append-last-volume');
            if (addButton && appendSection && appendSection.classList.contains('hide')) {
                addButton.click();
                log(`Đã mở mục thêm file của quyển "${selectedOption.textContent}".`);
            } else {
                log(`Đã chọn quyển "${selectedOption.textContent}".`);
            }
        } else {
            // Quyển thường → không bấm append
            log(`Đã chọn quyển "${selectedOption.textContent}" (không bổ sung).`);
        }

        // Reset vùng nhập tay
        manualInputContainer.style.display = 'none';
        manualInputContainer.innerHTML = '';

        uploadBtn.disabled = false;
    }

    // Khởi tạo: Tìm các quyển và điền vào dropdown
    function initialize() {
        log('Khởi tạo... 🚀');

        // Chỉ rebuild danh sách quyển, KHÔNG auto chọn quyển nào
        rebuildVolumeOptions('none'); // truyền strategy không khớp để bỏ qua auto-select

        // Reset trạng thái lựa chọn
        state.selectedVolumeWrapper = null;
        uploadBtn.disabled = true;

        // Ẩn + reset vùng nhập tay (cho chắc)
        manualInputContainer.style.display = 'none';
        manualInputContainer.innerHTML = '';

        log('Sẵn sàng. Vui lòng chọn quyển.');
    }

    function readFirstLineOfFile(file) {
        return new Promise((resolve) => {
            const encoding = settings.FILE_ENCODING || 'UTF-8';
            const reader = new FileReader();

            reader.onload = (e) => {
                const text = e.target.result || '';
                let firstLine = text.split(/\r?\n/)[0].trim();
                if (firstLine.length > 500) firstLine = firstLine.substring(0, 500);
                resolve(firstLine);
            };

            reader.onerror = () => resolve('');
            reader.readAsText(file.slice(0, 2048), encoding);
        });
    }

    // Hàm parse Regex chung
    function matchRegex(text, regexStr) {
        if (!text || !regexStr) return null;
        try {
            const re = new RegExp(regexStr, 'i');
            const m = text.match(re);
            if (m && m[1]) { // Ít nhất phải bắt được num (group 1)
                return { num: parseInt(m[1], 10), title: m[2] || '' };
            }
        } catch (e) { return null; }
        return null;
    }

    async function parseFileSmart(file) {
        const priority = settings.PARSE_PRIORITY;
        const filenameBase = file.name.replace(/\.txt$/i, '');

        let result = null;
        let firstLine = '';

        // --- CACHE 1: Ưu tiên FILE NAME ---
        if (priority === 'filename') {
            // Thử parse tên file
            result = matchRegex(filenameBase, settings.FILENAME_REGEX);
            if (result) return { ...result, source: 'filename' };

            // Fallback: Tên file tạch -> Đọc dòng đầu
            firstLine = await readFirstLineOfFile(file);
            result = matchRegex(firstLine, settings.CONTENT_REGEX);
            if (result) return { ...result, source: 'content' };
        }

        // --- CACHE 2: Ưu tiên CONTENT (Dòng đầu) ---
        else {
            firstLine = await readFirstLineOfFile(file);
            // Thử parse dòng đầu
            result = matchRegex(firstLine, settings.CONTENT_REGEX);
            if (result) return { ...result, source: 'content' };

            // Fallback: Dòng đầu tạch -> Parse tên file
            result = matchRegex(filenameBase, settings.FILENAME_REGEX);
            if (result) return { ...result, source: 'filename' };
        }

        return null; // Không parse được cả 2 cách
    }

    function applyTemplate(template, num, title) {
        return template
            .replace(/{num}/g, num.toString())
            .replace(/{title}/g, title || '');
    }

    // Xử lý khi người dùng chọn file
    async function handleFileSelect(event) {
        if (!state.selectedVolumeWrapper) {
            log('Lỗi: state.selectedVolumeWrapper không tồn tại.', 'error');
            return;
        }

        const files = Array.from(event.target.files);
        if (files.length === 0) {
            log('Không có file nào được chọn.', 'warn');
            return;
        }

        log(`Đã chọn ${files.length} file. Đang xử lý...`);
        manualInputContainer.innerHTML = ''; // Xóa sạch UI cũ
        state.validFiles = [];
        state.invalidFiles = [];

        // Kiểm tra file nhỏ
        const warningSize = settings.FILE_SIZE_WARNING_KB * 1024;
        const smallFiles = files.filter(f => f.size < warningSize);

        if (smallFiles.length > 0 && warningSize > 0) { // Thêm check warningSize > 0 để cho phép tắt
            log(`⚠️ Phát hiện ${smallFiles.length} file dưới ${settings.FILE_SIZE_WARNING_KB}KB.`, 'warn');
            smallFiles.forEach(f => log(`- ${f.name} (${(f.size / 1024).toFixed(2)} KB)`, 'warn'));
            if (!confirm(`Có ${smallFiles.length} file nhỏ hơn ${settings.FILE_SIZE_WARNING_KB}KB. Bạn có chắc chắn muốn tiếp tục không?`)) {
                log('⛔ Đã hủy tải lên.');
                fileInput.value = ""; // Reset input
                return;
            }
        }

        // Sắp xếp file theo tên
        files.sort((a, b) => a.name.localeCompare(b.name, 'vi', { numeric: true, sensitivity: 'base' }));
        state.allFiles = files;

        if (settings.USE_FIRST_LINE_ONLY) {
            log(`Đang đọc dòng đầu và sắp xếp ${files.length} file...`);
            const titles = await Promise.all(files.map(readFirstLineOfFile));
            state.validFiles = files.map((file, idx) => {
                const firstLine = (titles[idx] || '').trim();
                return {
                    file,
                    chapterNumber: null,
                    rawTitle: firstLine
                };
            });
            state.invalidFiles = [];
            manualInputContainer.style.display = 'none';
            manualInputContainer.innerHTML = '';
            startUploading();
            return;
        }

        log(`Đang phân tích ${files.length} file (Chế độ ưu tiên: ${settings.PARSE_PRIORITY === 'content' ? 'Dòng đầu' : 'Tên file'})...`);

        const chapterNumbers = new Map();
        const parsePromises = files.map(async (file) => {
            const info = await parseFileSmart(file);
            return { file, info };
        });

        const results = await Promise.all(parsePromises);

        for (const item of results) {
            const { file, info } = item;

            if (!info) {
                state.invalidFiles.push({ file, reason: 'Không tìm thấy số chương (cả tên file & dòng đầu).' });
                log(`❌ File "${file.name}": Parse thất bại cả 2 cách.`, 'error');
                continue;
            }

            const { num, title } = info;

            if (chapterNumbers.has(num)) {
                state.invalidFiles.push({ file, reason: `Trùng chương ${num}` });
                log(`❌ File "${file.name}" trùng chương ${num}.`, 'error');
                continue;
            }

            chapterNumbers.set(num, file);
            // Lưu rawTitle để tý nữa dùng code fix lỗi
            state.validFiles.push({ file, chapterNumber: num, rawTitle: title });
        }

        state.validFiles.sort((a, b) => a.chapterNumber - b.chapterNumber);

        let hasError = false; // Cờ chung cho TẤT CẢ các loại lỗi

        // 1. Kiểm tra trùng lặp (và lưu lại message)
        const duplicateMessages = []; // Mảng lưu message
        chapterNumbers.forEach((fileList, number) => {
            if (fileList.length > 1) {
                const msg = `TRÙNG LẶP: Chương ${number} có ${fileList.length} file: ${fileList.join(', ')}`;
                log(msg, 'error');
                duplicateMessages.push(msg); // Thêm message vào mảng
                hasError = true;
            }
        });

        // 2. Kiểm tra thiếu chương (và lưu lại message)
        let missingMessage = null; // Biến lưu message
        let minChapter, maxChapter;
        if (state.validFiles.length > 0) {
            const allChapterNums = state.validFiles.map(item => item.chapterNumber);
            minChapter = allChapterNums[0];
            maxChapter = allChapterNums[allChapterNums.length - 1];

            const missingChapters = [];
            for (let i = minChapter; i <= maxChapter; i++) {
                if (!allChapterNums.includes(i)) {
                    missingChapters.push(i);
                }
            }

            if (missingChapters.length > 0) {
                const msg = `THIẾU CHƯƠNG: ${missingChapters.join(', ')}`;
                log(msg, 'warn');
                missingMessage = msg; // Lưu lại message
                hasError = true;
            }
        }

        // 3. Đẩy thông báo (trùng/thiếu) lên UI
        // Phải đảm bảo container được hiển thị nếu có lỗi
        if (hasError) {
            manualInputContainer.style.display = 'block';
        }

        duplicateMessages.forEach(msg => {
            manualInputContainer.appendChild(createUIWarning(msg, 'error'));
        });

        if (missingMessage) {
            manualInputContainer.appendChild(createUIWarning(missingMessage, 'warn'));
        }

        // 4. Xử lý file không hợp lệ

        if (state.invalidFiles.length > 0) {
            log(`Có ${state.invalidFiles.length} file không parse được num, cần chèn thủ công:`, 'warn');

            state.previewOrder = state.validFiles.map(item => ({
                type: 'valid',
                file: item.file,
                chapterNumber: item.chapterNumber,
                rawTitle: item.rawTitle
            }));

            state.remainingInvalidFiles = state.invalidFiles.map(x => x.file);

            buildInsertPreviewUI(manualInputContainer);

            manualInputContainer.style.display = 'block';
            hasError = true;
        }


        // 5. Cập nhật mô tả (logic cũ, không đổi)
        const trueWrapper = state.selectedVolumeWrapper.querySelector('.volume-wrapper');
        const descInfo = computeDescInfo();
        if (descInfo.text) {
            const synced = syncAppendDesc(trueWrapper, descInfo.text);
            if (synced) {
                log(`✅ Đã điền mô tả${descInfo.guessed ? ' (dự đoán)' : ''}: ${descInfo.text}`);
            } else {
                log('⚠️ Không tìm thấy ô mô tả để điền.', 'warn');
            }
        } else {
            log('Không tìm thấy số chương để điền mô tả.', 'warn');
        }

        // 6. Tạo nút xác nhận (logic cũ, nhưng giờ nó bắt được mọi `hasError`)
        if (hasError) {
            const buttonWrapper = document.createElement('div');
            buttonWrapper.className = `${APP_PREFIX}button-group`;

            const continueBtn = document.createElement('button');
            continueBtn.innerText = '✅ Vẫn tiếp tục';
            continueBtn.className = `${APP_PREFIX}btn`;
            continueBtn.style.backgroundColor = '#4CAF50';

            const cancelBtn = document.createElement('button');
            cancelBtn.innerText = '❌ Hủy bỏ';
            cancelBtn.className = `${APP_PREFIX}btn`;
            cancelBtn.style.backgroundColor = '#f44336';

            buttonWrapper.appendChild(continueBtn);
            buttonWrapper.appendChild(cancelBtn);
            manualInputContainer.appendChild(buttonWrapper);

            continueBtn.onclick = () => {
                manualInputContainer.style.display = 'none';
                manualInputContainer.innerHTML = '';
                startUploading();
            };
            cancelBtn.onclick = () => {
                log('⛔ Đã dừng quá trình.');
                manualInputContainer.innerHTML = '';
                manualInputContainer.style.display = 'none';
                fileInput.value = ""; // Reset input
            };
        } else {
            // Chỉ chạy khi không có BẤT KỲ lỗi nào
            log('Tất cả file hợp lệ. Bắt đầu tải lên...');
            manualInputContainer.style.display = 'none'; // Ẩn đi nếu không có lỗi
            startUploading();
        }
    }

    function openInsertPopup(insertIndex) {
        if (state.remainingInvalidFiles.length === 0) {
            alert('Không còn file để chèn');
            return;
        }

        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.background = 'rgba(0,0,0,0.4)'; // vẫn mờ nền sau
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.zIndex = '999999';

        const box = document.createElement('div');
        box.style.background = '#fff';
        box.style.color = '#000';
        box.style.padding = '12px';
        box.style.borderRadius = '8px';
        box.style.width = '350px';
        box.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';


        const title = document.createElement('div');
        title.textContent = 'Chọn 1 file để chèn';
        title.style.fontWeight = 'bold';
        title.style.marginBottom = '8px';
        box.appendChild(title);

        const list = document.createElement('div');
        let selected = 0;

        state.remainingInvalidFiles.forEach((file, idx) => {
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.gap = '8px';
            row.style.padding = '4px';
            row.style.cursor = 'pointer';

            if (idx === 0) row.style.background = '#f5f5f5';


            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'ins-radio';
            radio.checked = idx === 0;

            const span = document.createElement('span');
            span.textContent = file.name;

            row.onclick = () => {
                selected = idx;
                Array.from(list.children).forEach(r => { r.style.background = 'transparent'; });
                row.style.background = '#e3f2fd';
                radio.checked = true;
            };

            row.appendChild(radio);
            row.appendChild(span);
            list.appendChild(row);
        });

        box.appendChild(list);

        const btnRow = document.createElement('div');
        btnRow.style.display = 'flex';
        btnRow.style.justifyContent = 'flex-end';
        btnRow.style.gap = '6px';
        btnRow.style.marginTop = '10px';

        const cancel = document.createElement('button');
        cancel.textContent = 'Hủy';
        cancel.onclick = () => document.body.removeChild(overlay);

        const ok = document.createElement('button');
        ok.textContent = 'Chèn';
        ok.style.background = '#ff9800';
        ok.style.color = '#fff';

        ok.onclick = () => {
            const file = state.remainingInvalidFiles[selected];
            if (!file) return;

            // Chèn
            state.previewOrder.splice(insertIndex, 0, {
                type: 'insert',
                file,
                chapterNumber: null,
                rawTitle: null
            });

            // Xóa khỏi remaining
            state.remainingInvalidFiles.splice(selected, 1);

            document.body.removeChild(overlay);
            renderPreviewList();
        };

        btnRow.appendChild(cancel);
        btnRow.appendChild(ok);
        box.appendChild(btnRow);

        overlay.appendChild(box);
        document.body.appendChild(overlay);
    }


    function createPlusRow(index, label) {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.gap = '6px';
        row.style.alignItems = 'center';
        row.style.padding = '4px 0';

        // + bên trái
        const leftBtn = createPlusButton(index);
        row.appendChild(leftBtn);

        // text ở giữa
        const span = document.createElement('span');
        span.style.color = '#888';
        span.textContent = label || '';
        row.appendChild(span);

        // + bên phải (cùng insertIndex, chèn vào cùng vị trí)
        const rightBtn = createPlusButton(index);
        row.appendChild(rightBtn);

        return row;
    }



    function createPlusButton(insertIndex) {
        const btn = document.createElement('button');
        btn.textContent = '+';
        btn.style.width = '22px';
        btn.style.height = '22px';
        btn.style.borderRadius = '50%';

        btn.style.border = '1px solid #ff9800';
        btn.style.background = '#fffbe6';
        btn.style.color = '#e65100';


        btn.style.cursor = 'pointer';

        btn.onclick = () => openInsertPopup(insertIndex);
        return btn;
    }


    function buildInsertPreviewUI(container) {
        container.innerHTML = `
        <div style="font-weight:bold;margin-bottom:6px;">🧩 Sắp xếp file chèn</div>
        <div style="font-size:12px;color:#ccc;margin-bottom:8px;">
            Bấm nút <b>+</b> để chèn file vào vị trí muốn.
            Nếu chèn nhầm, hãy nhấn vào ô màu cam để bỏ file đó khỏi sắp xếp.
        </div>
    `;


        const wrap = document.createElement('div');
        wrap.id = `${APP_PREFIX}preview-wrapper`;
        container.appendChild(wrap);

        state._previewWrapperEl = wrap;
        renderPreviewList();
    }

    function renderPreviewList() {
        const wrapper = state._previewWrapperEl;
        if (!wrapper) return;

        wrapper.innerHTML = '';

        const list = state.previewOrder;

        // nút + đầu danh sách
        // wrapper.appendChild(createPlusRow(0, 'Đầu'));

        list.forEach((item, idx) => {
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.alignItems = 'center';
            row.style.gap = '6px';
            row.style.padding = '4px 0';

            if (item.type === 'insert') {
                row.style.background = '#fff8e1';
                row.style.borderRadius = '4px';
                row.style.border = '1px dashed #ffc107';
                row.style.cursor = 'pointer';
                row.title = 'Nhấn để bỏ file này khỏi sắp xếp';

                // Cho phép nhấn vào hàng cam để bỏ chèn
                row.addEventListener('click', (ev) => {
                    // Nếu bấm vào nút + thì không xử lý “bỏ chèn”
                    const target = ev.target;
                    if (target && target.tagName && target.tagName.toLowerCase() === 'button') {
                        return;
                    }

                    if (!confirm('Bỏ file này khỏi danh sách sắp xếp và đưa lại về bảng chọn file?')) {
                        return;
                    }

                    // Xoá khỏi previewOrder
                    const removedList = state.previewOrder.splice(idx, 1);
                    const removed = removedList && removedList[0];

                    // Đưa lại file vào remainingInvalidFiles (nếu có)
                    if (removed && removed.file) {
                        if (!Array.isArray(state.remainingInvalidFiles)) {
                            state.remainingInvalidFiles = [];
                        }
                        state.remainingInvalidFiles.push(removed.file);
                    }

                    renderPreviewList();
                });
            }



            // + trước
            row.appendChild(createPlusButton(idx));

            const text = document.createElement('span');
            text.style.flex = '1';
            text.style.whiteSpace = 'nowrap';
            text.style.overflow = 'hidden';
            text.style.textOverflow = 'ellipsis';

            if (item.type === 'valid') {
                text.textContent = `C.${item.chapterNumber} - ${item.file.name}`;
            } else {
                text.textContent = item.file.name;
                text.style.color = '#e65100'; // cam đậm cho dễ thấy
            }
            row.appendChild(text);

            // + sau (nút này sẽ luôn nằm sát bên phải)
            row.appendChild(createPlusButton(idx + 1));


            wrapper.appendChild(row);
        });

        // wrapper.appendChild(createPlusRow(list.length, 'Cuối'));
    }

    // Tạo thông báo lỗi/cảnh báo trên UI
    function createUIWarning(message, type = 'error') {
        const wrapper = document.createElement('div');
        wrapper.className = `${APP_PREFIX}manual-file-entry`; // Dùng chung class để có padding/margin

        const label = document.createElement('label');
        // Dùng màu đỏ (error) hoặc màu cam (warning)
        label.style.color = (type === 'error') ? '#d9534f' : '#f0ad4e'; // Màu đỏ (giống) hoặc màu cam (cảnh báo)
        label.style.fontSize = '13px';
        label.style.fontWeight = 'bold';
        label.innerText = message;

        wrapper.appendChild(label);
        return wrapper;
    }

    // Bắt đầu quá trình điền file vào form
    async function startUploading() {
        log('🚀 Bắt đầu quá trình điền file...');
        const trueWrapper = state.selectedVolumeWrapper.querySelector('.volume-wrapper');
        if (!trueWrapper) {
            log('Lỗi: Không tìm thấy .volume-wrapper. Đã dừng.', 'error');
            return;
        }

        let mergedFiles;

        if (state.previewOrder && state.previewOrder.length > 0) {
            mergedFiles = state.previewOrder.map(item => ({
                file: item.file,
                chapterNumber: item.chapterNumber,
                rawTitle: item.rawTitle
            }));
        } else {
            mergedFiles = state.validFiles.map(item => ({
                file: item.file,
                chapterNumber: item.chapterNumber,
                rawTitle: item.rawTitle
            }));
        }


        // Cập nhật lại tổng số file
        const numFiles = mergedFiles.length;
        if (numFiles === 0) {
            log('Không có file nào để tải lên. Đã dừng.', 'warn');
            return;
        }

        log(`Tổng cộng sẽ tải lên ${numFiles} file.`);

        // Đặt số lượng file vào input
        const numFileInput = trueWrapper.querySelector('input[name="numFile"]');
        if (numFileInput) {
            numFileInput.value = numFiles;
            log('✅ Đã cập nhật ô "Số file".');
            // Kích hoạt sự kiện 'change' để Materialize cập nhật UI (nhãn nổi lên)
            const event = new Event('change', { bubbles: true });
            numFileInput.dispatchEvent(event);
        } else {
            log('⚠️ Không tìm thấy ô "Số file".', 'warn');
        }

        // Tắt tự động đánh số
        const autoNumberCheckbox = trueWrapper.querySelector('input[name="autoNumber"]');
        if (autoNumberCheckbox && autoNumberCheckbox.checked) {
            autoNumberCheckbox.click();
            log('✅ Đã tắt "Đánh số tự động".');
        }

        // Thêm các hàng nhập chương
        const addChapterBtn = trueWrapper.querySelector('[data-action="addChapterInfo"]');
        const chapterWrapperContainer = trueWrapper.querySelector('.chapter-wrapper');

        if (!addChapterBtn || !chapterWrapperContainer) {
            log('Lỗi nghiêm trọng: Không tìm thấy nút thêm chương hoặc vùng chứa chương.', 'error');
            return;
        }

        //         // Xóa các hàng cũ nếu có
        //         chapterWrapperContainer.innerHTML = '';
        //         log('Đã dọn dẹp các hàng chương cũ (nếu có).');

        //         // Tạo các hàng mới
        //         for (let i = 0; i < numFiles; i++) {
        //             addChapterBtn.click();
        //         }

        // Đợi DOM cập nhật
        await new Promise(resolve => {
            const checkInterval = setInterval(() => {
                if (chapterWrapperContainer.querySelectorAll('.chapter-info-wrapper').length === numFiles) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 50); // Kiểm tra mỗi 50ms
        });

        log(`✅ Đã tạo ${numFiles} hàng nhập liệu.`);

        // Điền thông tin vào từng hàng
        const chapterRows = chapterWrapperContainer.querySelectorAll('.chapter-info-wrapper');
        mergedFiles.forEach((item, idx) => {
            const row = chapterRows[idx];
            if (!row) {
                log(`Lỗi: Hàng ${idx + 1} không tồn tại!`, 'error');
                return;
            }

            const file = item.file;
            const nameInput = row.querySelector('input[name="name"]');
            const fileTextInput = row.querySelector('input.file-path');
            const fileInputReal = row.querySelector('input[type="file"]');

            let chapterName;

            if (item.chapterNumber != null) {
                const titleFromName = (typeof item.rawTitle === 'string') ? item.rawTitle.trim() : file.name.replace(/\.txt$/i, '').trim();
                const tpl = settings.CHAPTER_NAME_TEMPLATE || '第{num}章 {title}';
                chapterName = applyTemplate(tpl, item.chapterNumber, titleFromName);
                chapterName = chapterName.trim();
            } else {
                const directTitle = (typeof item.rawTitle === 'string') ? item.rawTitle.trim() : '';
                chapterName = directTitle || file.name.replace(/\.txt$/i, '');
            }

            if (nameInput) {
                nameInput.value = chapterName;
                const event = new Event('change', { bubbles: true });
                nameInput.dispatchEvent(event);
            }
            if (fileTextInput) fileTextInput.value = file.name;

            // Tạo DataTransfer để gán file vào input
            try {
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                if (fileInputReal) fileInputReal.files = dataTransfer.files;
            } catch (e) {
                log(`Lỗi khi gán file: ${e.message}`, 'error');
            }

            log(`...Đã gán file "${file.name}" vào hàng ${idx + 1}`);
        });

        log('🎉 Hoàn tất! Tất cả các file đã sẵn sàng để tải lên.', 'success');
        fakeUploadBtn.disabled = false;
        log("✔ Sẵn sàng để Upload. Nút Tải lên đã được bật!", "success");


        // Đặt lại input file để có thể chọn lại cùng 1 file (nếu cần)
        fileInput.value = "";
    }

    // --- Khởi động script ---
    if (state.isEditPage || state.isNewBookPage) {
        hidePanel();
        floatingIconEl.addEventListener('pointerdown', (e) => {
            iconDragged = false;
            const startX = e.clientX;
            const startY = e.clientY;
            const onMove = (ev) => {
                if (Math.abs(ev.clientX - startX) > 3 || Math.abs(ev.clientY - startY) > 3) {
                    iconDragged = true;
                    floatingIconEl.removeEventListener('pointermove', onMove);
                }
            };
            floatingIconEl.addEventListener('pointermove', onMove);
            floatingIconEl.addEventListener('pointerup', () => {
                floatingIconEl.removeEventListener('pointermove', onMove);
            }, { once: true });
        });
        floatingIconEl.addEventListener('click', () => {
            if (iconDragged) return;
            showPanel();
        });
        minimizeBtn.addEventListener('click', hidePanel);
        helpBtn.addEventListener('click', openHelpModal);
        helpCloseBtn.addEventListener('click', closeHelpModal);
        uploadBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', handleFileSelect);
        volumeSelect.addEventListener('change', handleVolumeChange);
        volumeSelect.addEventListener('mousedown', () => {
            state._prevSelectValue = volumeSelect.value;
            rebuildVolumeOptions('preserve');
        });

        // --- Khai báo thêm biến DOM ---
        const encodingSelect = shadowRoot.querySelector(`#${APP_PREFIX}setting-encoding`);

        // Biến lưu trạng thái ban đầu
        let initialFormValues = {};

        // Hàm lấy tất cả giá trị hiện tại trong Form
        function getFormValues() {
            return {
                logMax: logMaxInput.value,
                fileKb: fileSizeKbInput.value,
                firstLineOnly: firstLineOnlyInput.checked,
                priority: prioritySelect.value,
                encoding: encodingSelect.value,
                contentRegex: contentRegexInput.value,
                filenameRegex: filenameRegexInput.value,
                chapTemplate: chapterTemplateInput.value
            };
        }

        function showSettingsModal() {
            // Tải cài đặt hiện tại vào input
            logMaxInput.value = settings.LOG_MAX_LINES;
            fileSizeKbInput.value = settings.FILE_SIZE_WARNING_KB;
            firstLineOnlyInput.checked = !!settings.USE_FIRST_LINE_ONLY;
            prioritySelect.value = settings.PARSE_PRIORITY || 'filename';
            contentRegexInput.value = settings.CONTENT_REGEX || '';
            encodingSelect.value = settings.FILE_ENCODING || 'UTF-8';
            filenameRegexInput.value = settings.FILENAME_REGEX;
            chapterTemplateInput.value = settings.CHAPTER_NAME_TEMPLATE;

            setParseControlsEnabled(!firstLineOnlyInput.checked);
            if (filenameSampleInput && !filenameSampleInput.value) filenameSampleInput.value = '第188章 禅说.txt';
            if (contentSampleInput && !contentSampleInput.value) contentSampleInput.value = '第188章 禅说';
            initialFormValues = getFormValues();
            settingsOverlay.classList.remove(`${APP_PREFIX}hide`);
            settingsModal.classList.remove(`${APP_PREFIX}hide`);
        }

        function hideSettingsModal() {
            settingsOverlay.classList.add(`${APP_PREFIX}hide`);
            settingsModal.classList.add(`${APP_PREFIX}hide`);
            if (filenameSampleInput) {
                filenameSampleInput.style.height = '0';
                filenameSampleInput.style.padding = '0 8px';
                filenameSampleInput.style.margin = '0';
                filenameSampleInput.style.opacity = '0';
                filenameSampleInput.style.pointerEvents = 'none';
            }

        }
        function tryCloseSettingsModal() {
            const currentValues = getFormValues();
            if (JSON.stringify(currentValues) !== JSON.stringify(initialFormValues)) {
                if (!confirm('Bạn có thay đổi chưa lưu. Bạn có chắc muốn hủy không?')) {
                    return; // Không đóng
                }
            }
            hideSettingsModal();
        }

        function handleOverlayClick() {
            if (!helpModal.classList.contains(`${APP_PREFIX}hide`)) {
                closeHelpModal();
            } else {
                tryCloseSettingsModal();
            }
        }

        settingsBtn.addEventListener('click', showSettingsModal);
        settingsCancelBtn.addEventListener('click', tryCloseSettingsModal);
        settingsOverlay.addEventListener('click', handleOverlayClick);
        firstLineOnlyInput.addEventListener('change', () => {
            setParseControlsEnabled(!firstLineOnlyInput.checked);
        });
        settingsSaveBtn.addEventListener('click', () => {
            const newLogMax = parseInt(logMaxInput.value, 10);
            const newFileKb = parseInt(fileSizeKbInput.value, 10);
            const newRegex = filenameRegexInput.value.trim();
            const newChapTpl = chapterTemplateInput.value.trim() || '第{num}章 {title}';
            const useFirstLineOnly = firstLineOnlyInput.checked;

            // Bắt buộc phải có {num}
            if (!useFirstLineOnly && !newChapTpl.includes('{num}')) {
                alert('Template phải chứa {num}.');
                return;
            }

            // Test regex có hợp lệ không
            if (!useFirstLineOnly) {
                try {
                    new RegExp(newRegex);
                } catch (e) {
                    alert('Regex tên file không hợp lệ: ' + e.message);
                    return;
                }
            }

            if (isNaN(newLogMax) || newLogMax <= 0) {
                alert('Số dòng log phải là số dương.');
                return;
            }
            if (isNaN(newFileKb) || newFileKb < 0) {
                // Cho phép 0 để tắt cảnh báo
                alert('Kích thước file (KB) phải là số không âm (0 hoặc lớn hơn).');
                return;
            }

            settings.LOG_MAX_LINES = newLogMax;
            settings.FILE_SIZE_WARNING_KB = newFileKb;
            settings.USE_FIRST_LINE_ONLY = useFirstLineOnly;
            settings.FILENAME_REGEX = newRegex;
            settings.CHAPTER_NAME_TEMPLATE = newChapTpl;

            settings.PARSE_PRIORITY = prioritySelect.value;
            settings.CONTENT_REGEX = contentRegexInput.value.trim();
            settings.FILE_ENCODING = encodingSelect.value;

            saveSettings(); // Lưu vào localStorage
            initialFormValues = getFormValues();
            hideSettingsModal();
            log('Cài đặt đã được cập nhật.');
        });

        initialize();
    }
})();
