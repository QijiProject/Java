<html>
<head>
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js"></script>
    <script type="text/javascript">
        $(document).ready(function($){
            $('#submitPayment').click(function(e){
                var paymentData = $("input[name='pGateWayReq']").val();
                $.ajax({
                    type : "POST",
                    contentType : "application/xml",
                    url : "/dubbo-consumer/savePaymentDetails",
                    data : paymentData,
                    dataType : 'xml',
                    timeout : 100000,
                    success : function(data) {
                        console.log("success");
                    },
                    error : function(e) {
                        console.log("ERROR: ", e);
                    }
                });
        
            });
    
        });
        
    </script>
</head>
<body>
	<h1>Payment Details</h1>
        ${paymentData}
        <form action="http://localhost:8080/ips-gateway/payment" method="post" target="_blank">
            <input name="pGateWayReq" type="hidden" value="${paymentData}">
            <input id="submitPayment" type="submit" value="Submit"/>
	</form>

</body>
</html>