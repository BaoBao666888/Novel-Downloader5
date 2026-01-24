// ==UserScript==
// @name         Wikidich Autofill
// @namespace    http://tampermonkey.net/
// @version      0.1.0
// @description  Lấy thông tin từ web Trung, dịch và tự tick/điền form nhúng truyện trên truyenwikidich.net.
// @author       QuocBao
// @icon         data:image/x-icon;base64,AAABAAEAQEAAAAEAIAAoQgAAFgAAACgAAABAAAAAgAAAAAEAIAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAADaxiYA2sYmAdrGJnPaxibZ2sYm+9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJvzaxibf2sYmgNrGJgbaxiYA2sYmAtrGJpzaxib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axiaw2sYmCNrGJm3axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJn/axibd2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axibl2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axiT/2cUg/9jDG//Ywxr/2MMZ/9jDGf/Ywxr/2cQd/9rFIv/axiX/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJf/axSL/2cQd/9jDGv/Ywxn/2MMZ/9jDGf/Ywxv/2cQe/9rFI//axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cUi/9jDGv/Ywxr/28cp/+DORf/l12X/6dx6/+vgh//r4If/6Nt1/+PTVv/dyjT/2cQe/9jDGf/ZxB//2sYm/9rGJv/axib/2sYm/9rGJv/axiT/2cQd/9jDGf/ZxSD/3cs3/+PUWv/o3Hf/6+CH/+vgh//q3oH/5tls/+HRT//cyC7/2cQc/9jDGf/ZxSD/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxSD/2MMa/93LN//n2nL/8eqt//n23P/+/vr//////////////////////////////////Prs//Xvw//r4In/4M9G/9nEHf/ZxB3/2sYm/9rGJP/Ywxr/2sYm/+LTVf/t45L/9vHI//377v//////////////////////////////////////+/jk//PtuP/p3n//381B/9nEHP/ZxB7/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJf/Ywxj/3sw7/+/moP/9++7///////////////////////////////////////////////////////////////////////7++f/z7bf/4dFN/9jCF//axiX/6d16//j01f////////////////////////////////////////////////////////////////////////////799f/y67L/4M9I/9jDGP/axiT/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYn/9nFIf/ZxR//6d19//z77P/////////////////////////////////////////////////////////////////////////////////////////////++//w56T/9/LN//////////////////////////////////////////////////////////////////////////////////////////////////799v/s4Yr/2sYj/9nEH//axif/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYn/9nEH//byCz/8+yz//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////Xww//dyzj/2cQc/9rGJ//axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYn/9nEHv/cyS//9/LN//////////////////////////////////////////////////389P/7+OT/+PXX//n12P/8+un////9///////////////////////////////////////////////////////////////////////////////9//z66//59tz/+PTV//r33//8++7/////////////////////////////////////////////////+vji/+HQSf/Zwxv/2sYn/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nFIP/cyS//9/LN///////////////////////////////////////59tv/7eOS/+PUWv/ezDv/3Mgt/9rGJf/axib/3Mkx/+DQSf/p3Xr/9vHI//////////////////////////////////////////////////799f/z7LX/6Ntz/+DQSf/cyTL/28co/9rGJP/bxyr/3co1/+LSUP/r34X/9/PQ///////////////////////////////////////7+ej/385C/9nEHf/axif/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJP/ZxR//9O68//////////////////////////////////r44v/o23X/28co/9jCGP/ZxBz/2cUh/9rGI//axiX/2sYk/9rFI//ZxB//2MMY/9nFIP/k1V//9vLL/////////////////////////////v76/+/mnv/fzT//2MMb/9jDGf/ZxB//2sUj/9rGJP/axiX/2sYk/9rFIv/ZxB7/2MMY/9rFIv/l1mP/+fXX//////////////////////////////////n12P/byCv/2sUi/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxj/6t6B//////////////////////////////////Pstv/cyjL/2MMX/9rGJP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axiX/2MMa/9rFIv/r4Ib//fvv////////////+fXY/+LSUf/Ywxf/2cUf/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axiX/2MMZ/9vIKf/w6KX/////////////////////////////////8emr/9jDGv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxSD/380///788/////////////////////////////Hpqf/ZxB7/2cUg/9rGJ//axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axSH/2MMX//bwxf//////9e/A/9zJLf/Zwxv/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axSL/2MMa/+zhiv/////////////////////////////////m2Gf/2cQa/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMa//Hpqf////////////////////////////PstP/ZxB7/2sUi/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMZ/+3jkv//////9fDE/9rGJv/ZxR//2sYn/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJP/Ywxf/7uSW////////////////////////////+vfh/9vIKv/axiP/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sUh/97MO//+/fX///////////////////////r44f/cyS7/2cUg/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQc/+PTVf////7/+/jj/93KMv/ZxB7/2sYn/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYj/9nFHv/178H////////////////////////////p3Xv/2MMZ/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDGv/o3Hf////////////////////////////n2m//2MMY/9rGJ//axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYl/9rFIv/388///////+TWYP/Ywxn/2sYn/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/381A//388///////////////////////+PTS/9rFIv/axiX/2sYm/9rGJv/axib/2sYm/9rGJv/ZxBv/8+y2///////////////////////59tv/2sYm/9rGJP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axSP/2cUh/9rFIv/axiX/2sYm/9nEG//m12b///////Pstf/Ywxr/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sUj/9nFIf/ZxSL/2sYl/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDF//u5Zr//////////////////////////P/gz0j/2cUf/9rGJv/axib/2sYm/9rGJv/axiT/3Mgs//v45P//////////////////////7eKR/9jDGP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rFI//Ywxv/3Mkv/97MPv/dyzf/2cQf/9nEHv/ZxB3/9e/C///////h0U7/2cQd/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axiP/2MMa/9zILv/ezD7/3cs4/9nEH//ZxB7/2sYn/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxSD/381A//799v//////////////////////6d5+/9jDGf/axib/2sYm/9rGJv/axib/2cQe/+HRTv////7//////////////////////+LSU//ZxB3/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rFIv/bxyj/7uSW//v45P/+/fb//fvv//Tuu//fzkL/3co0///++//38sv/2cQe/9rGJf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axSL/28cn/+3jlP/7+OP//v32//378P/07r3/4dBK/9nEHP/axif/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHf/28MX///////////////////////Lrs//ZxBv/2sYm/9rGJv/axib/2sYm/9jDGv/o23b///////////////////////z67P/cyjL/2sYj/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJf/axSD/8+23////////////////////////////+/nl/+3jk///////6t5+/9jDGf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axiX/2cUg//PstP////////////////////////////377//gz0X/2cUf/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxj/7eKP///////////////////////59tz/28cn/9rGJP/axib/2sYm/9rGJv/Ywxn/7uSZ///////////////////////489D/2sUi/9rGJf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxBv/5tlr///////////////////////////////////////////////8/+HQSf/ZxR//2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQb/+bYaP//////////////////////////////////////9O69/9nEHf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bYaf///////////////////////fzz/97MOv/axSH/2sYm/9rGJv/axib/2MMb//LqsP//////////////////////9O26/9jDHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQe//XwxP////////////////////////////////////////////v55v/cyC3/2sYj/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHf/177/////////////////////////////////////////+/P/gz0f/2cUf/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHv/i01T///////////////////////7++//fzkT/2cUg/9rGJv/axib/2sYm/9nEHf/07r////////////////////////Dopv/Ywxn/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sUi/93LNv/9/PH////////////////////////////////////////////38s3/2sUh/9rGJf/axib/2sYm/9rGJv/axib/2sYm/9rFIv/dyjT//fvu////////////////////////////////////////////6dx5/9jDGv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/4tJT///////////////////////+/vr/385D/9nFIP/axib/2sYm/9rGJv/ZxB3/9O6////////////////////////v56H/2MMZ/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHv/i0lD/////////////////////////////////////////////////9O69/9nEHf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/4dFO/////////////////////////////////////////////////+/mnf/Ywxn/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQe/+LSU////////////////////////v76/9/OQ//ZxSD/2sYm/9rGJv/axib/2cQd//Tuv///////////////////////7+ei/9jDGf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxBz/5ddl//////////////////////////////////////////////////Ptuf/ZxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQc/+XWY//////////////////////////////////////////////////z7LX/2cQb/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHv/i0lP///////////////////////7++v/fzkP/2cUg/9rGJv/axib/2sYm/9nEHf/07r///////////////////////+/nov/Ywxn/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bZa//////////////////////////////////////////////////z7bn/2MQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//n2Gn/////////////////////////////////////////////////9e68/9nEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/4tJT///////////////////////+/vr/385D/9nFIP/axib/2sYm/9rGJv/ZxB3/9O6////////////////////////v56L/2MMZ/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m2Gr/////////////////////////////////////////////////8+25/9jEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5tdo//////////////////////////////////////////////////Ttu//ZxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQe/+LSU////////////////////////v76/9/OQ//ZxSD/2sYm/9rGJv/axib/2cQd//Tuv///////////////////////7+ei/9jDGf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5thq//////////////////////////////////////////////////Ptuf/YxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bXaP/////////////////////////////////////////////////07bv/2cQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHv/i0lP///////////////////////7++v/fzkP/2cUg/9rGJv/axib/2sYm/9nEHf/07r///////////////////////+/nov/Ywxn/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bYav/////////////////////////////////////////////////z7bn/2MQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m12j/////////////////////////////////////////////////9O27/9nEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/4tJT///////////////////////+/vr/385D/9nFIP/axib/2sYm/9rGJv/ZxB3/9O6////////////////////////v56L/2MMZ/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m2Gr/////////////////////////////////////////////////8+25/9jEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5tdo//////////////////////////////////////////////////Ttu//ZxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQe/+LSU////////////////////////v76/9/OQ//ZxSD/2sYm/9rGJv/axib/2cQd//Tuv///////////////////////7+ei/9jDGf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5thq//////////////////////////////////////////////////Ptuf/YxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bXaP/////////////////////////////////////////////////07bv/2cQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHv/i0lP///////////////////////7++v/fzkP/2cUg/9rGJv/axib/2sYm/9nEHf/07r///////////////////////+/nov/Ywxn/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bYav/////////////////////////////////////////////////z7bn/2MQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m12j/////////////////////////////////////////////////9O27/9nEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/4tJT///////////////////////+/vr/385D/9nFIP/axib/2sYm/9rGJv/ZxB3/9O6////////////////////////v56L/2MMZ/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m2Gr/////////////////////////////////////////////////8+25/9jEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5tdo//////////////////////////////////////////////////Ttu//ZxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQe/+LSU////////////////////////v76/9/OQ//ZxSD/2sYm/9rGJv/axib/2cQd//Tuv///////////////////////7+ei/9jDGf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5thq//////////////////////////////////////////////////Ptuf/YxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bXaP/////////////////////////////////////////////////07bv/2cQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHv/i0lP///////////////////////7++v/fzkP/2cUg/9rGJv/axib/2sYm/9nEHf/07r///////////////////////+/nov/Ywxn/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bYav/////////////////////////////////////////////////z7bn/2MQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m12j/////////////////////////////////////////////////9O27/9nEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/4tJT///////////////////////+/vr/385D/9nFIP/axib/2sYm/9rGJv/ZxB3/9O6////////////////////////v56L/2MMZ/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m2Gr/////////////////////////////////////////////////8+25/9jEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5tdo//////////////////////////////////////////////////Ttu//ZxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQe/+LSU////////////////////////v76/9/OQ//ZxSD/2sYm/9rGJv/axib/2cQd//Tuv///////////////////////7+ei/9jDGf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5thq//////////////////////////////////////////////////Ptuf/YxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bXaP/////////////////////////////////////////////////07bv/2cQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9nEHv/i0lP///////////////////////7++v/fzkP/2cUg/9rGJv/axib/2sYm/9nEHf/07r///////////////////////+/nov/Ywxn/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2MMb/+bYav/////////////////////////////////////////////////z7bn/2MQc/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m12j/////////////////////////////////////////////////9O27/9nEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/ZxB7/4tJT///////////////////////+/vr/385D/9nFIP/axib/2sYm/9rGJv/ZxB3/9O6////////////////////////v56L/2MMZ/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9jDG//m2Gr/////////////////////////////////////////////////8+25/9jEHP/axib/2sYm/9rGJv/axib/2sYm/9rGJv/Ywxv/5tdo//////////////////////////////////////////////////Ttu//ZxBz/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cQe/+LSU////////////////////////v76/9/OQ//ZxSD/2sYm/9rGJv/axib/2cQd//Tuv///////////////////////7+ei/9jDGP/axiX/2sYl/9rGJf/axiX/2sYl/9rGJf/Ywxr/5thq//////////////////////////////////////////////////Ptuf/YxBv/2sYl/9rGJf/axiX/2sYl/9rGJf/axiX/2MMa/+bXaP/////////////////////////////////////////////////07bv/2cQb/9rGJf/axiX/2sYl/9rGJf/axiX/2sYl/9nEHf/i0lP///////////////////////7++v/fzkP/2cUg/9rGJv/axib/2sYm/9nEHf/078D//////////////////////+/mn//XwRL/2cQf/9nEH//ZxB//2cQf/9nEH//ZxB//18EU/+XXZv/////////////////////////////////////////////////z7bf/18IV/9nEH//ZxB//2cQf/9nEH//ZxB//2cQf/9fBFP/l1mP/////////////////////////////////////////////////9O25/9jCFf/ZxB//2cQf/9nEH//ZxB//2cQf/9nEH//Ywhf/4dFO///////////////////////+/vv/385E/9nFIP/axib/2sYm/9rGJv/ZxBz/8+25///////////////////////7+ej/9fDE//bxyP/28cj/9vHI//bxyP/28cj/9vHI//Xwxf/59dn//////////////////////////////////////////////////Pvt//Xwxf/28cj/9vHI//bxyP/28cj/9vHI//bxyP/18MX/+fXZ//////////////////////////////////////////////////z77v/28MX/9vHI//bxyP/28cj/9vHI//bxyP/28cj/9vDG//j00////////////////////////v73/9/NP//ZxSH/2sYm/9rGJv/axib/2MMZ/+zijf/////////////////////////////////////////////////////////////////////////////////////////////////+/ff//////////////////////////////////////////////////////////////////////////////////////////////////v33//////////////////////////////////////////////////////////////////////////////////////////////////n22//bxib/2sYk/9rGJv/axib/2sYm/9nEHv/i0U/////+////////////////////////////////////////////////////////////////////////////////////////////7eOT//z66////////////////////////////////////////////////////////////////////////////////////////////+7klv/7+eb////////////////////////////////////////////////////////////////////////////////////////////v5pz/2MMa/9rGJv/axib/2sYm/9rGJv/axib/2cQb/+3klf//////////////////////////////////////////////////////////////////////////////////////9fDD/9jDGf/p3Xz///////////////////////////////////////////////////////////////////////////////////////bxyP/ZxBv/6Nt1///////////////////////////////////////////////////////////////////////////////////////59tr/3Mkv/9rFIv/axib/2sYm/9rGJv/axib/2sYm/9rGJP/axSH/6+CJ//378P///////////////////////////////////////////////////////////////////vz/8uqu/9zILv/ZxSD/2cQd/+ncef/8+uz////////////////////////////////////////////////////////////////////9//Lqr//cyS//2cUg/9nEHf/o3Hj//Prr/////////////////////////////////////////////////////////////////////v/07rv/3sw5/9nEHv/axif/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYk/9jDG//ezDv/5thp/+3jkv/u5Jj/7uSY/+7kmP/u5Jj/7uSY/+7kmP/u5Jj/7uSY/+7kl//o3Hj/4M9I/9nEH//axSH/2sYn/9rGJf/Ywxv/3cs3/+XXZ//t45H/7uSY/+7kmP/u5Jj/7uSY/+7kmP/u5Jj/7uSY/+7kmP/u5Jf/6dx6/+DQSv/ZxB//2cUh/9rGJ//axiX/2MMb/93LNv/l12X/7eKQ/+7kmP/u5Jj/7uSY/+7kmP/u5Jj/7uSY/+7kmP/u5Jj/7uSY/+ndfP/h0Ez/2sUi/9nFH//axif/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2cUh/9jDG//Ywxn/2MMZ/9jDGf/Ywxn/2MMZ/9jDGf/Ywxn/2MMZ/9jDGf/Ywxn/2MMa/9nEH//axiX/2sYm/9rGJv/axib/2sYm/9rFIv/Ywxv/2MMZ/9jDGf/Ywxn/2MMZ/9jDGf/Ywxn/2MMZ/9jDGf/Ywxn/2MMZ/9jDGv/ZxB//2sYl/9rGJv/axib/2sYm/9rGJv/axSL/2cQc/9jDGf/Ywxn/2MMZ/9jDGf/Ywxn/2MMZ/9jDGf/Ywxn/2MMZ/9jDGf/Ywxr/2cQf/9rGJf/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv7axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv7axibW2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axibf2sYmX9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYmcdrGJgDaxiaH2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYmnNrGJgPaxiYA2sYmANrGJmHaxibR2sYm+trGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJv/axib/2sYm/9rGJvzaxibX2sYmb9rGJgDaxiYAgAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAwAAAAAAAAAM=
// @downloadURL  https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/Fanqie_Wikidich_Autofill.user.js
// @updateURL    https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/Fanqie_Wikidich_Autofill.user.js
// @match        https://truyenwikidich.net/nhung-file
// @match        https://koanchay.org/nhung-file
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @connect      api5-normal-sinfonlineb.fqnovel.com
// @connect      dichngay.com
// @connect      fanqiesdkpic.com
// @connect      *
// ==/UserScript==

(function () {
    'use strict';

    if (!/\/nhung-file$/.test(location.pathname)) return;

    const APP_PREFIX = 'WDA_';
    const SERVER_URL = 'https://dichngay.com/translate/text';
    const MAX_CHARS = 4500;
    const REQUEST_DELAY_MS = 350;
    const SCORE_THRESHOLD = 0.9;
    const SCORE_FALLBACK = 0.65;
    const MAX_TAGS_SELECT = 25;
    const ROOT_NEG_WORDS = ['vo', 'khong', 'phi', 'chong', 'phan', 'non', 'no'];
    const ROOT_MODIFIERS = new Set([
        'song', 'nhieu', 'main', 'ca', 'nha', 'nu', 'nam', 'trang', 'phan', 'sat',
        'la', 'toan', 'tap', 'the'
    ]);

    const state = {
        groups: null,
        rawData: null,
        translated: null,
        suggestions: null,
    };

    function sleep(ms) {
        return new Promise(r => setTimeout(r, ms));
    }

    function safeText(v) {
        return (v || '').toString().trim();
    }

    function normalizeText(text = '') {
        return text
            .toString()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^\p{L}\p{N}\s]/gu, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function bigramDice(a, b) {
        if (!a || !b) return 0;
        if (a === b) return 1;
        if (a.length < 2 || b.length < 2) return 0;
        const map = new Map();
        for (let i = 0; i < a.length - 1; i++) {
            const g = a.slice(i, i + 2);
            map.set(g, (map.get(g) || 0) + 1);
        }
        let intersection = 0;
        for (let i = 0; i < b.length - 1; i++) {
            const g = b.slice(i, i + 2);
            const count = map.get(g) || 0;
            if (count > 0) {
                map.set(g, count - 1);
                intersection++;
            }
        }
        return (2 * intersection) / ((a.length - 1) + (b.length - 1));
    }

    function similarityScore(a, b) {
        const na = normalizeText(a).replace(/\s+/g, '');
        const nb = normalizeText(b).replace(/\s+/g, '');
        if (!na || !nb) return 0;
        if (na === nb) return 1;
        if (na.includes(nb) || nb.includes(na)) {
            const shortLen = Math.min(na.length, nb.length);
            const longLen = Math.max(na.length, nb.length);
            return 0.98 * (shortLen / longLen);
        }
        return bigramDice(na, nb);
    }

    function splitTokens(text) {
        return normalizeText(text).split(' ').filter(Boolean);
    }

    function resolveNegationConflicts(labels) {
        const normalizedMap = new Map();
        labels.forEach(label => normalizedMap.set(normalizeText(label), label));
        const toRemove = new Set();

        normalizedMap.forEach((origLabel, normLabel) => {
            const tokens = splitTokens(normLabel);
            if (tokens.length < 2) return;
            if (!ROOT_NEG_WORDS.includes(tokens[0])) return;
            const base = tokens.slice(1).join(' ');
            if (normalizedMap.has(base)) {
                toRemove.add(normalizedMap.get(base));
            }
        });

        return labels.filter(label => !toRemove.has(label));
    }

    function rootKey(label) {
        let tokens = splitTokens(label);
        while (tokens.length && ROOT_NEG_WORDS.includes(tokens[0])) {
            tokens.shift();
        }
        tokens = tokens.filter(tok => !ROOT_MODIFIERS.has(tok));
        if (!tokens.length) return normalizeText(label);
        return tokens.join(' ');
    }

    function collapseByRoot(items) {
        const bestByRoot = new Map();
        items.forEach(item => {
            const key = rootKey(item.label);
            const existing = bestByRoot.get(key);
            if (!existing) {
                bestByRoot.set(key, item);
                return;
            }
            if (item.score > existing.score) {
                bestByRoot.set(key, item);
                return;
            }
            if (item.score === existing.score) {
                const curLen = normalizeText(item.label).replace(/\s+/g, '').length;
                const prevLen = normalizeText(existing.label).replace(/\s+/g, '').length;
                if (curLen > prevLen) bestByRoot.set(key, item);
            }
        });
        return Array.from(bestByRoot.values());
    }

    function splitIntoBatches(arr, maxChars) {
        const batches = [];
        let current = [];
        let currentLen = 0;
        for (const s of arr) {
            const len = (s || '').length;
            if (current.length && currentLen + len + current.length > maxChars) {
                batches.push(current);
                current = [s];
                currentLen = len;
            } else {
                current.push(s);
                currentLen += len;
            }
        }
        if (current.length) batches.push(current);
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
                    if (res.status < 200 || res.status >= 300) {
                        reject(new Error('HTTP Error: ' + res.status));
                        return;
                    }
                    try {
                        const jsonResponse = JSON.parse(res.responseText);
                        const translatedContentString = jsonResponse?.data?.content ?? jsonResponse?.translatedText;
                        if (typeof translatedContentString !== 'string') {
                            throw new Error('Bad translation response.');
                        }
                        const sanitizedString = translatedContentString
                            .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
                            .replace(/\\(?!["\\\/bfnrtu])/g, '\\\\');
                        resolve(JSON.parse(sanitizedString));
                    } catch (e) {
                        reject(e);
                    }
                },
                onerror(err) {
                    reject(err);
                },
            });
        });
    }

    async function translateList(list) {
        const items = Array.isArray(list) ? list : [];
        const batches = splitIntoBatches(items, MAX_CHARS);
        const result = [];
        for (const batch of batches) {
            try {
                const translated = await postTranslate(SERVER_URL, batch, 'vi');
                result.push(...translated);
            } catch (err) {
                // fallback: giữ nguyên đoạn lỗi
                result.push(...batch);
            }
            await sleep(REQUEST_DELAY_MS);
        }
        return result;
    }

    async function translateLongText(text) {
        const raw = safeText(text);
        if (!raw) return '';
        if (raw.length <= MAX_CHARS) {
            const [translated] = await translateList([raw]);
            return translated || raw;
        }
        const parts = raw.split(/\n{2,}/g).map(s => s.trim()).filter(Boolean);
        const translatedParts = await translateList(parts);
        return translatedParts.join('\n\n');
    }

    function extractBookId(url) {
        const m = safeText(url).match(/\/(?:page|reader)\/(\d+)/);
        if (m) return m[1];
        const onlyDigits = safeText(url).match(/(\d{10,})/);
        return onlyDigits ? onlyDigits[1] : '';
    }

    function fetchFanqieData(bookId) {
        const apiUrl = `https://api5-normal-sinfonlineb.fqnovel.com/reading/bookapi/multi-detail/v/?aid=2329&iid=1&version_code=999&book_id=${bookId}`;
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: apiUrl,
                responseType: 'json',
                onload(res) {
                    let parsed = res.response;
                    if (!parsed && res.responseText) {
                        try { parsed = JSON.parse(res.responseText); } catch { parsed = null; }
                    }
                    const data = parsed?.data?.[0] || null;
                    if (!data) {
                        reject(new Error('Fanqie API không có dữ liệu.'));
                        return;
                    }
                    resolve(data);
                },
                onerror(err) {
                    reject(err);
                },
            });
        });
    }

    function getGroupOptions() {
        const groups = {
            status: [],
            official: [],
            gender: [],
            age: [],
            ending: [],
            genre: [],
            tag: [],
        };
        const inputs = Array.from(document.querySelectorAll('.book-attr-group input[name]'));
        inputs.forEach((input) => {
            const name = input.getAttribute('name');
            if (!groups[name]) return;
            const labelEl = document.querySelector(`label[for="${input.id}"]`);
            const label = labelEl ? labelEl.textContent.trim() : '';
            groups[name].push({ input, label });
        });
        return groups;
    }

    function buildKeywordList(raw, translated) {
        const tags = safeText(raw.tags)
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);
        const pureTags = safeText(raw.pure_category_tags)
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);
        const categoryV2 = Array.isArray(raw.category_v2)
            ? raw.category_v2
            : (() => {
                try { return JSON.parse(raw.category_v2 || '[]'); } catch { return []; }
            })();
        const categoryNames = categoryV2.map(c => c?.Name).filter(Boolean);
        const cat = safeText(raw.category) ? [safeText(raw.category)] : [];
        const rawList = [...tags, ...pureTags, ...categoryNames, ...cat];
        const translatedList = translated?.tags || [];
        const translatedCats = translated?.categories || [];
        const combined = [...rawList, ...translatedList, ...translatedCats]
            .map(safeText)
            .filter(Boolean);
        return Array.from(new Set(combined));
    }

    function detectStatus(raw, textBlob) {
        const cn = normalizeText(textBlob);
        const hasDone = /hoan thanh|da xong|da hoan thanh|完结|完本|已完结/.test(cn);
        const hasPause = /tam ngung|暂停|断更|停更/.test(cn);
        if (hasDone) return 'Hoàn thành';
        if (hasPause) return 'Tạm ngưng';
        if (raw.update_status === 1) return 'Hoàn thành';
        if (raw.update_status === 0) return 'Còn tiếp';
        return 'Còn tiếp';
    }

    function detectOfficial(keywords) {
        const blob = normalizeText(keywords.join(' '));
        if (/(dong nhan|dien sinh|衍生|同人)/.test(blob)) return 'Diễn sinh';
        return 'Nguyên sang';
    }

    function detectGender(keywords) {
        const blob = normalizeText(keywords.join(' '));
        if (/(song nam chu|双男主)/.test(blob)) return 'Đam mỹ';
        if (/(bach hop|百合|双女主)/.test(blob)) return 'Bách hợp';
        if (/(nu ton|女尊)/.test(blob)) return 'Nữ tôn';
        if (/(khong cp|无cp|无 c p)/.test(blob)) return 'Không CP';
        if (/(ngon tinh|言情|nu ph|女频)/.test(blob)) return 'Ngôn tình';
        if (/(nam sinh|男频|男主)/.test(blob)) return 'Nam sinh';
        return '';
    }

    function scoreOptions(options, keywords, textBlob) {
        const normalizedText = normalizeText(textBlob);
        const scored = options.map(opt => {
            const label = safeText(opt.label);
            const normLabel = normalizeText(label);
            const labelLen = normLabel.replace(/\s+/g, '').length;
            const labelTokens = splitTokens(normLabel);
            let score = 0;
            if (normLabel && labelLen >= 4 && normalizedText.includes(normLabel)) score = 1;
            if (normLabel && labelTokens.length > 1 && !ROOT_NEG_WORDS.includes(labelTokens[0])) {
                for (const w of ROOT_NEG_WORDS) {
                    if (normalizedText.includes(`${w} ${normLabel}`)) {
                        score = Math.min(score, 0.1);
                        break;
                    }
                }
            }
            for (const kw of keywords) {
                const s = similarityScore(label, kw);
                if (s > score) score = s;
            }
            return { ...opt, score };
        });
        scored.sort((a, b) => b.score - a.score);
        return scored;
    }

    function pickMulti(scored, limit, requireOne, collapseRoot) {
        const selected = scored.filter(o => o.score >= SCORE_THRESHOLD);
        let picked = selected;
        if (!picked.length && requireOne && scored.length) {
            const fallback = scored[0];
            picked = [fallback];
        }
        if (collapseRoot) picked = collapseByRoot(picked);
        if (limit && picked.length > limit) picked = picked.slice(0, limit);
        return resolveNegationConflicts(picked.map(o => o.label));
    }

    function pickRadio(scored, requireOne) {
        if (!scored.length) return '';
        const best = scored[0];
        if (best.score >= SCORE_THRESHOLD) return best.label;
        if (requireOne) return best.label;
        return '';
    }

    function buildSuggestions(raw, translated, groups) {
        const descCn = safeText(raw.book_abstract_v2 || raw.abstract);
        const descVi = safeText(translated?.desc || '');
        const tagsVi = translated?.tags || [];
        const catsVi = translated?.categories || [];

        const keywords = buildKeywordList(raw, translated);
        const textBlob = [descCn, descVi, keywords.join(' ')].join(' ');

        const statusLabel = detectStatus(raw, textBlob);
        const officialLabel = detectOfficial(keywords);
        const genderLabel = detectGender(keywords);

        const statusScored = scoreOptions(groups.status, [statusLabel], textBlob);
        const officialScored = scoreOptions(groups.official, [officialLabel], textBlob);
        const genderScored = scoreOptions(groups.gender, [genderLabel], textBlob);

        const ageScored = scoreOptions(groups.age, keywords, textBlob);
        const endingScored = scoreOptions(groups.ending, keywords, textBlob);
        const genreScored = scoreOptions(groups.genre, keywords, textBlob);
        const tagScored = scoreOptions(groups.tag, keywords.concat(tagsVi, catsVi), textBlob);

        return {
            status: pickRadio(statusScored, true),
            official: pickRadio(officialScored, true),
            gender: pickRadio(genderScored, false),
            age: pickMulti(ageScored, 4, true),
            ending: pickMulti(endingScored, 3, true),
            genre: pickMulti(genreScored, 8, true),
            tag: pickMulti(tagScored, MAX_TAGS_SELECT, true, true),
        };
    }

    function setInputValue(el, value) {
        if (!el) return;
        el.value = value || '';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function applyRadio(group, label) {
        if (!group || !label) return;
        const scored = scoreOptions(group, [label], label);
        const best = scored[0];
        if (!best) return;
        best.input.checked = true;
        best.input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function applyCheckboxes(group, labels) {
        if (!group || !Array.isArray(labels)) return;
        group.forEach(opt => {
            opt.input.checked = false;
            opt.input.dispatchEvent(new Event('change', { bubbles: true }));
        });
        for (const label of labels) {
            const scored = scoreOptions(group, [label], label);
            const best = scored[0];
            if (!best || best.score < SCORE_FALLBACK) continue;
            best.input.checked = true;
            best.input.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    function parseLabelList(text) {
        return safeText(text)
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);
    }

    function fetchCoverBlob(url) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url,
                responseType: 'blob',
                onload(res) {
                    if (res.status < 200 || res.status >= 300) {
                        reject(new Error('Không tải được ảnh bìa.'));
                        return;
                    }
                    resolve(res.response);
                },
                onerror(err) {
                    reject(err);
                },
            });
        });
    }

    async function applyCover(url, log) {
        const fileInput = document.querySelector('input[type="file"][data-change="changeCoverFile"]');
        if (!fileInput || !url) return;
        try {
            log('Đang tải ảnh bìa...');
            const blob = await fetchCoverBlob(url);
            const type = blob.type || 'image/jpeg';
            const ext = type.includes('/') ? type.split('/')[1] : 'jpg';
            const file = new File([blob], 'cover.' + ext, { type });
            const dt = new DataTransfer();
            dt.items.add(file);
            fileInput.files = dt.files;
            fileInput.dispatchEvent(new Event('change', { bubbles: true }));
            log('Đã gán ảnh bìa.');
        } catch (err) {
            log('Lỗi tải ảnh bìa: ' + err.message, 'error');
        }
    }

    function createUI() {
        const shadowHost = document.createElement('div');
        shadowHost.id = `${APP_PREFIX}host`;
        document.body.appendChild(shadowHost);
        const shadowRoot = shadowHost.attachShadow({ mode: 'open' });

        const css = `
            :host { all: initial; }
            #${APP_PREFIX}btn {
                position: fixed; bottom: 20px; right: 20px; z-index: 99999;
                width: 48px; height: 48px; border-radius: 50%;
                background: #ff9800; color: #fff; border: none;
                font-size: 14px; cursor: grab; font-family: Arial, sans-serif;
                display: flex; align-items: center; justify-content: center;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            }
            #${APP_PREFIX}btn:active { cursor: grabbing; }
            #${APP_PREFIX}panel {
                position: fixed; bottom: 70px; right: 20px; width: 420px; max-height: 75vh;
                background: #fff; color: #222; border: 1px solid #ddd; border-radius: 10px;
                box-shadow: 0 10px 24px rgba(0,0,0,0.18); font-family: Arial, sans-serif;
                z-index: 99999; display: none; flex-direction: column;
            }
            #${APP_PREFIX}header {
                padding: 10px 14px; background: #f7f7f7; border-bottom: 1px solid #e3e3e3;
                font-weight: bold; font-size: 14px; display: flex; justify-content: space-between;
            }
            #${APP_PREFIX}content { padding: 12px 14px; overflow: auto; }
            .${APP_PREFIX}row { margin-bottom: 10px; }
            .${APP_PREFIX}label { font-size: 12px; color: #555; margin-bottom: 4px; display: block; }
            .${APP_PREFIX}input, .${APP_PREFIX}textarea, .${APP_PREFIX}select {
                width: 100%; box-sizing: border-box; padding: 6px 8px; border: 1px solid #ccc;
                border-radius: 6px; font-size: 13px; font-family: inherit;
            }
            .${APP_PREFIX}textarea { min-height: 80px; resize: vertical; }
            .${APP_PREFIX}btn {
                background: #2196f3; color: #fff; border: none; border-radius: 6px;
                padding: 8px 10px; cursor: pointer; font-size: 13px; margin-right: 6px;
            }
            .${APP_PREFIX}btn.secondary { background: #6c757d; }
            .${APP_PREFIX}icon-btn {
                background: #fff; border: 1px solid #bbb; color: #333; border-radius: 50%;
                width: 26px; height: 26px; font-weight: bold; font-size: 14px;
                display: inline-flex; align-items: center; justify-content: center; cursor: pointer;
                margin-right: 8px;
            }
            .${APP_PREFIX}log {
                background: #111; color: #0f0; padding: 8px; border-radius: 6px;
                font-family: "Courier New", monospace; font-size: 11px; max-height: 100px; overflow: auto;
            }
            .${APP_PREFIX}hint { font-size: 11px; color: #777; }
            .${APP_PREFIX}grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
            .${APP_PREFIX}modal {
                position: fixed; inset: 0; background: rgba(0,0,0,0.45);
                display: none; align-items: center; justify-content: center; z-index: 100000;
                font-family: Arial, sans-serif;
            }
            .${APP_PREFIX}modal-card {
                background: #fff; color: #222; border-radius: 10px; width: 520px; max-width: 92vw;
                padding: 16px; box-shadow: 0 12px 28px rgba(0,0,0,0.22);
            }
            .${APP_PREFIX}modal-title { font-weight: bold; margin-bottom: 8px; }
            .${APP_PREFIX}modal-body { font-size: 13px; line-height: 1.45; white-space: pre-line; }
            .${APP_PREFIX}modal-actions { margin-top: 12px; text-align: right; }
        `;

        shadowRoot.innerHTML = `
            <style>${css}</style>
            <button id="${APP_PREFIX}btn">AF</button>
            <div id="${APP_PREFIX}panel">
                <div id="${APP_PREFIX}header">
                    <span>Fanqie → Wikidich</span>
                    <div>
                        <button id="${APP_PREFIX}help" class="${APP_PREFIX}icon-btn">?</button>
                        <button id="${APP_PREFIX}close" class="${APP_PREFIX}btn secondary">Đóng</button>
                    </div>
                </div>
                <div id="${APP_PREFIX}content">
                    <div class="${APP_PREFIX}row">
                        <label class="${APP_PREFIX}label">Fanqie URL</label>
                        <input id="${APP_PREFIX}url" class="${APP_PREFIX}input" placeholder="https://fanqienovel.com/page/..." />
                    </div>
                    <div class="${APP_PREFIX}row">
                        <button id="${APP_PREFIX}fetch" class="${APP_PREFIX}btn">Lấy dữ liệu</button>
                        <button id="${APP_PREFIX}recompute" class="${APP_PREFIX}btn secondary">Recompute</button>
                    </div>
                    <div class="${APP_PREFIX}row">
                        <div id="${APP_PREFIX}log" class="${APP_PREFIX}log"></div>
                    </div>
                    <div class="${APP_PREFIX}row">
                        <label class="${APP_PREFIX}label">Từ khóa bổ sung (phân cách dấu phẩy)</label>
                        <input id="${APP_PREFIX}extraKeywords" class="${APP_PREFIX}input" placeholder="ví dụ: tiên hiệp, HE, hiện đại" />
                    </div>
                    <div class="${APP_PREFIX}row">
                        <label class="${APP_PREFIX}label">Tên gốc (CN)</label>
                        <input id="${APP_PREFIX}titleCn" class="${APP_PREFIX}input" />
                    </div>
                    <div class="${APP_PREFIX}row">
                        <label class="${APP_PREFIX}label">Tên tác giả (CN)</label>
                        <input id="${APP_PREFIX}authorCn" class="${APP_PREFIX}input" />
                    </div>
                    <div class="${APP_PREFIX}row">
                        <label class="${APP_PREFIX}label">Tên dịch (VI)</label>
                        <input id="${APP_PREFIX}titleVi" class="${APP_PREFIX}input" />
                    </div>
                    <div class="${APP_PREFIX}row">
                        <label class="${APP_PREFIX}label">Mô tả dịch (VI)</label>
                        <textarea id="${APP_PREFIX}descVi" class="${APP_PREFIX}textarea"></textarea>
                    </div>
                    <div class="${APP_PREFIX}row">
                        <label class="${APP_PREFIX}label">Cover URL</label>
                        <input id="${APP_PREFIX}coverUrl" class="${APP_PREFIX}input" />
                    </div>
                    <div class="${APP_PREFIX}grid ${APP_PREFIX}row">
                        <div>
                            <label class="${APP_PREFIX}label">Tình trạng (radio)</label>
                            <select id="${APP_PREFIX}status" class="${APP_PREFIX}select"></select>
                        </div>
                        <div>
                            <label class="${APP_PREFIX}label">Tính chất (radio)</label>
                            <select id="${APP_PREFIX}official" class="${APP_PREFIX}select"></select>
                        </div>
                        <div>
                            <label class="${APP_PREFIX}label">Giới tính (radio)</label>
                            <select id="${APP_PREFIX}gender" class="${APP_PREFIX}select"></select>
                        </div>
                    </div>
                    <div class="${APP_PREFIX}row">
                        <label class="${APP_PREFIX}label">Thời đại (nhập label, phân cách dấu phẩy)</label>
                        <input id="${APP_PREFIX}age" class="${APP_PREFIX}input" />
                    </div>
                    <div class="${APP_PREFIX}row">
                        <label class="${APP_PREFIX}label">Kết thúc (nhập label, phân cách dấu phẩy)</label>
                        <input id="${APP_PREFIX}ending" class="${APP_PREFIX}input" />
                    </div>
                    <div class="${APP_PREFIX}row">
                        <label class="${APP_PREFIX}label">Loại hình (nhập label, phân cách dấu phẩy)</label>
                        <input id="${APP_PREFIX}genre" class="${APP_PREFIX}input" />
                    </div>
                    <div class="${APP_PREFIX}row">
                        <label class="${APP_PREFIX}label">Tag (nhập label, phân cách dấu phẩy)</label>
                        <textarea id="${APP_PREFIX}tag" class="${APP_PREFIX}textarea"></textarea>
                    </div>
                    <div class="${APP_PREFIX}row">
                        <button id="${APP_PREFIX}apply" class="${APP_PREFIX}btn">Áp vào form</button>
                    </div>
                    <div class="${APP_PREFIX}row ${APP_PREFIX}hint">
                        Tip: có thể sửa text/label trong panel rồi bấm "Áp vào form".
                    </div>
                </div>
            </div>
            <div id="${APP_PREFIX}helpModal" class="${APP_PREFIX}modal">
                <div class="${APP_PREFIX}modal-card">
                    <div class="${APP_PREFIX}modal-title">Hướng dẫn nhanh</div>
                    <div class="${APP_PREFIX}modal-body">
1) Dán link Fanqie vào ô URL rồi bấm "Lấy dữ liệu".
2) Script sẽ dịch tên/mô tả/tag và gợi ý tick các mục phù hợp.
3) Bạn có thể chỉnh lại nội dung, tag, thể loại trước khi áp.
4) Bấm "Áp vào form" để điền và tick tự động + upload ảnh bìa.
5) Nếu sai gợi ý, sửa trực tiếp trong panel rồi áp lại.
                    </div>
                    <div class="${APP_PREFIX}modal-actions">
                        <button id="${APP_PREFIX}helpClose" class="${APP_PREFIX}btn secondary">Đóng</button>
                    </div>
                </div>
            </div>
        `;

        const btn = shadowRoot.getElementById(`${APP_PREFIX}btn`);
        const panel = shadowRoot.getElementById(`${APP_PREFIX}panel`);
        const close = shadowRoot.getElementById(`${APP_PREFIX}close`);
        const helpBtn = shadowRoot.getElementById(`${APP_PREFIX}help`);
        const helpModal = shadowRoot.getElementById(`${APP_PREFIX}helpModal`);
        const helpClose = shadowRoot.getElementById(`${APP_PREFIX}helpClose`);
        const logBox = shadowRoot.getElementById(`${APP_PREFIX}log`);

        function log(message, type) {
            const line = document.createElement('div');
            line.textContent = message;
            if (type === 'error') line.style.color = '#ff8080';
            if (type === 'warn') line.style.color = '#ffd166';
            if (type === 'ok') line.style.color = '#9ef01a';
            logBox.appendChild(line);
            logBox.scrollTop = logBox.scrollHeight;
        }

        function fillSelect(selectEl, options, suggested) {
            selectEl.innerHTML = '';
            const empty = document.createElement('option');
            empty.value = '';
            empty.textContent = '--- Tự động ---';
            selectEl.appendChild(empty);
            options.forEach(opt => {
                const o = document.createElement('option');
                o.value = opt.label;
                o.textContent = opt.label || '(trống)';
                selectEl.appendChild(o);
            });
            if (suggested) selectEl.value = suggested;
        }

        function fillText(id, value) {
            shadowRoot.getElementById(id).value = value || '';
        }

        async function handleFetch() {
            logBox.innerHTML = '';
            try {
                if (!state.groups) state.groups = getGroupOptions();
                const urlInput = shadowRoot.getElementById(`${APP_PREFIX}url`);
                const bookId = extractBookId(urlInput.value);
                if (!bookId) {
                    log('URL không hợp lệ.', 'error');
                    return;
                }
                GM_setValue(`${APP_PREFIX}last_url`, urlInput.value);
                log('Đang gọi API Fanqie...');
                const raw = await fetchFanqieData(bookId);
                state.rawData = raw;
                log('Đã lấy dữ liệu. Đang dịch...');

                const titleCn = safeText(raw.book_name || raw.original_book_name);
                const authorCn = safeText(raw.author);
                const descCn = safeText(raw.book_abstract_v2 || raw.abstract);
                const tagsRaw = safeText(raw.tags)
                    .split(',')
                    .map(s => s.trim())
                    .filter(Boolean);
                const categoryV2 = Array.isArray(raw.category_v2)
                    ? raw.category_v2
                    : (() => {
                        try { return JSON.parse(raw.category_v2 || '[]'); } catch { return []; }
                    })();
                const categoryNames = categoryV2.map(c => c?.Name).filter(Boolean);

                const titleVi = (await translateList([titleCn]))[0] || titleCn;
                const descVi = await translateLongText(descCn);
                const tagsVi = await translateList(tagsRaw);
                const catsVi = await translateList(categoryNames);

                state.translated = {
                    titleVi,
                    desc: descVi,
                    tags: tagsVi,
                    categories: catsVi,
                };

                const suggestions = buildSuggestions(raw, state.translated, state.groups);
                state.suggestions = suggestions;

                log('Dịch xong. Đang tạo gợi ý...');
                fillText(`${APP_PREFIX}titleCn`, titleCn);
                fillText(`${APP_PREFIX}authorCn`, authorCn);
                fillText(`${APP_PREFIX}titleVi`, titleVi);
                fillText(`${APP_PREFIX}descVi`, descVi);
                fillText(`${APP_PREFIX}coverUrl`, raw.expand_thumb_url || raw.thumb_url || '');

                fillSelect(shadowRoot.getElementById(`${APP_PREFIX}status`), state.groups.status, suggestions.status);
                fillSelect(shadowRoot.getElementById(`${APP_PREFIX}official`), state.groups.official, suggestions.official);
                fillSelect(shadowRoot.getElementById(`${APP_PREFIX}gender`), state.groups.gender, suggestions.gender);

                fillText(`${APP_PREFIX}age`, suggestions.age.join(', '));
                fillText(`${APP_PREFIX}ending`, suggestions.ending.join(', '));
                fillText(`${APP_PREFIX}genre`, suggestions.genre.join(', '));
                fillText(`${APP_PREFIX}tag`, suggestions.tag.join(', '));

                log('Gợi ý sẵn sàng. Bạn có thể chỉnh rồi bấm "Áp vào form".', 'ok');
            } catch (err) {
                log('Lỗi: ' + err.message, 'error');
            }
        }

        function handleRecompute() {
            if (!state.rawData || !state.groups) {
                log('Chưa có dữ liệu để recompute.', 'warn');
                return;
            }
            const extra = parseLabelList(shadowRoot.getElementById(`${APP_PREFIX}extraKeywords`).value);
            const baseKeywords = buildKeywordList(state.rawData, state.translated);
            const combinedKeywords = baseKeywords.concat(extra);
            const descCn = safeText(state.rawData.book_abstract_v2 || state.rawData.abstract);
            const descVi = safeText(state.translated?.desc || '');
            const textBlob = [descCn, descVi, combinedKeywords.join(' ')].join(' ');

            const suggestions = {
                status: state.suggestions?.status || '',
                official: state.suggestions?.official || '',
                gender: state.suggestions?.gender || '',
                age: pickMulti(scoreOptions(state.groups.age, combinedKeywords, textBlob), 4, true),
                ending: pickMulti(scoreOptions(state.groups.ending, combinedKeywords, textBlob), 3, true),
                genre: pickMulti(scoreOptions(state.groups.genre, combinedKeywords, textBlob), 8, true),
                tag: pickMulti(scoreOptions(state.groups.tag, combinedKeywords, textBlob), MAX_TAGS_SELECT, true, true),
            };
            state.suggestions = { ...state.suggestions, ...suggestions };
            fillText(`${APP_PREFIX}age`, suggestions.age.join(', '));
            fillText(`${APP_PREFIX}ending`, suggestions.ending.join(', '));
            fillText(`${APP_PREFIX}genre`, suggestions.genre.join(', '));
            fillText(`${APP_PREFIX}tag`, suggestions.tag.join(', '));
            log('Đã recompute theo từ khóa bổ sung.', 'ok');
        }

        async function handleApply() {
            if (!state.groups) state.groups = getGroupOptions();
            const titleCn = shadowRoot.getElementById(`${APP_PREFIX}titleCn`).value;
            const authorCn = shadowRoot.getElementById(`${APP_PREFIX}authorCn`).value;
            const titleVi = shadowRoot.getElementById(`${APP_PREFIX}titleVi`).value;
            const descVi = shadowRoot.getElementById(`${APP_PREFIX}descVi`).value;
            const coverUrl = shadowRoot.getElementById(`${APP_PREFIX}coverUrl`).value;

            setInputValue(document.getElementById('txtTitleCn'), titleCn);
            setInputValue(document.getElementById('txtAuthorCn'), authorCn);
            setInputValue(document.getElementById('txtTitleVi'), titleVi);
            setInputValue(document.getElementById('txtDescVi'), descVi);

            const statusSel = shadowRoot.getElementById(`${APP_PREFIX}status`).value;
            const officialSel = shadowRoot.getElementById(`${APP_PREFIX}official`).value;
            const genderSel = shadowRoot.getElementById(`${APP_PREFIX}gender`).value;

            applyRadio(state.groups.status, statusSel || state.suggestions?.status);
            applyRadio(state.groups.official, officialSel || state.suggestions?.official);
            applyRadio(state.groups.gender, genderSel || state.suggestions?.gender);

            const ageList = parseLabelList(shadowRoot.getElementById(`${APP_PREFIX}age`).value);
            const endingList = parseLabelList(shadowRoot.getElementById(`${APP_PREFIX}ending`).value);
            const genreList = parseLabelList(shadowRoot.getElementById(`${APP_PREFIX}genre`).value);
            const tagList = parseLabelList(shadowRoot.getElementById(`${APP_PREFIX}tag`).value);

            applyCheckboxes(state.groups.age, ageList.length ? ageList : state.suggestions?.age || []);
            applyCheckboxes(state.groups.ending, endingList.length ? endingList : state.suggestions?.ending || []);
            applyCheckboxes(state.groups.genre, genreList.length ? genreList : state.suggestions?.genre || []);
            applyCheckboxes(state.groups.tag, tagList.length ? tagList : state.suggestions?.tag || []);

            await applyCover(coverUrl, log);
            log('Đã áp dữ liệu vào form.', 'ok');
        }

        let dragging = false;
        let dragMoved = false;
        let dragOffsetX = 0;
        let dragOffsetY = 0;

        const savedPos = GM_getValue(`${APP_PREFIX}btn_pos`, null);
        if (savedPos && Number.isFinite(savedPos.left) && Number.isFinite(savedPos.top)) {
            btn.style.left = `${savedPos.left}px`;
            btn.style.top = `${savedPos.top}px`;
            btn.style.right = 'auto';
            btn.style.bottom = 'auto';
        }

        function getPoint(ev) {
            if (ev.touches && ev.touches.length) return ev.touches[0];
            return ev;
        }

        function onDragStart(ev) {
            const point = getPoint(ev);
            const rect = btn.getBoundingClientRect();
            dragging = true;
            dragMoved = false;
            dragOffsetX = point.clientX - rect.left;
            dragOffsetY = point.clientY - rect.top;
            ev.preventDefault();
        }

        function onDragMove(ev) {
            if (!dragging) return;
            const point = getPoint(ev);
            const rect = btn.getBoundingClientRect();
            const left = Math.max(0, Math.min(window.innerWidth - rect.width, point.clientX - dragOffsetX));
            const top = Math.max(0, Math.min(window.innerHeight - rect.height, point.clientY - dragOffsetY));
            btn.style.left = `${left}px`;
            btn.style.top = `${top}px`;
            btn.style.right = 'auto';
            btn.style.bottom = 'auto';
            dragMoved = true;
            ev.preventDefault();
        }

        function onDragEnd() {
            if (!dragging) return;
            dragging = false;
            const rect = btn.getBoundingClientRect();
            GM_setValue(`${APP_PREFIX}btn_pos`, { left: Math.round(rect.left), top: Math.round(rect.top) });
        }

        btn.addEventListener('mousedown', onDragStart);
        window.addEventListener('mousemove', onDragMove);
        window.addEventListener('mouseup', onDragEnd);
        btn.addEventListener('touchstart', onDragStart, { passive: false });
        window.addEventListener('touchmove', onDragMove, { passive: false });
        window.addEventListener('touchend', onDragEnd);

        btn.addEventListener('click', () => {
            if (dragMoved) return;
            const isHidden = getComputedStyle(panel).display === 'none';
            panel.style.display = isHidden ? 'flex' : 'none';
        });
        close.addEventListener('click', () => {
            panel.style.display = 'none';
        });
        helpBtn.addEventListener('click', () => {
            helpModal.style.display = 'flex';
        });
        helpClose.addEventListener('click', () => {
            helpModal.style.display = 'none';
        });
        helpModal.addEventListener('click', (ev) => {
            if (ev.target === helpModal) helpModal.style.display = 'none';
        });

        shadowRoot.getElementById(`${APP_PREFIX}fetch`).addEventListener('click', handleFetch);
        shadowRoot.getElementById(`${APP_PREFIX}recompute`).addEventListener('click', handleRecompute);
        shadowRoot.getElementById(`${APP_PREFIX}apply`).addEventListener('click', handleApply);

        const last = GM_getValue(`${APP_PREFIX}last_url`, '');
        if (last) shadowRoot.getElementById(`${APP_PREFIX}url`).value = last;
        log('Sẵn sàng. Dán link Fanqie rồi bấm "Lấy dữ liệu".');
    }

    createUI();
})();
