<?php

include("secure_data.php");
include("captureLog.php");

error_reporting(0);
ini_set('display_errors', 0);
$mode = isset($_GET['mode']) ? $_GET['mode'] : '';


$date = date('Y-m-d');
include("$_SERVER[DOCUMENT_ROOT]/src/main/php/Logger.php");
Logger::configure(array(
    'rootLogger' => array(
        'appenders' => array('default'),
    ),
    'appenders' => array(
        'default' => array(
            'class' => 'LoggerAppenderFile',
            'layout' => array(
                'class' => 'LoggerLayoutPattern',
                'params' => array(
                    'conversionPattern' => '%date{l jS \of F Y h:i:s A} process=[%pid] ip=%server{REMOTE_ADDR}:%server{REMOTE_PORT} %file/%method %message at line no = %line %newline  %newline',
                )
            ),
            'params' => array(
                'file' => 'log/vimport_automation_data_Log_' . $date . '.log',
                'append' => true
            )
        )
    )
));

$log = Logger::getLogger(__CLASS__);
$log->error($_REQUEST);

switch ($mode) {

    case 'unused_api':
        $log->error('unsed_api function called');
        unused_api();
        break;
    case 'smstest':
        //    echo "testing";die;
        // $log->error('smstest function called');
        $temp = array(
            'AMEX',
            'KOHLS/CAPONE',
            'VERIZON',
        );
        $tempType = array(
            'New',
            'New',
            'New',
        );
        sendNotificationAlert(370399, $temp, $creditor = 'transunion', $tempType);
        // sendMailWithWhatChangedStatus(1319028);
        break;


    case 'get_equifax_user':
        $log->error('get_equifax_user function called');
        get_equifax_user();
        break;
    case 'get_equifax_user_give_us_call':
        $log->error('get_equifax_user_give_us_call function called');
        get_equifax_user_give_us_call();
        break;
    case 'store_equifax_data':
        $log->error('store_equifax_data function called');
        store_equifax_data();
        break;
    case 'store_transunion_data':
        $log->error('store_transunion_data function called');
        store_transunion_data();
        break;
    case 'get_transunion_user':
        $log->error('get_transunion_user function called');
        get_transunion_user();
        break;
    case 'get_transunion_user_1':
        $log->error('get_transunion_user_1 function called');
        get_transunion_user_1();
        break;

    case 'get_experian_user':
        // $log->error('get_experian_user function called');
        $automated_data_id = $_GET['automated_data_id'] ?? '';
        get_experian_user($automated_data_id);
        break;
    case 'store_experian_data':
        $log->error('store_experian_data function called');
        store_experian_data();
        break;
    case 'delete_auto_despute_failed_transunion':
        $log->error('delete_auto_despute_failed_transunion function called');
        delete_auto_despute_failed_transunion();
        break;
    case 'get_experian_dispute_data':
        $log->error('get_experian_dispute_data function called');
        get_experian_dispute_data();
        break;
    case 'experian_dispute_error_api_error':
        $log->error('experian_dispute_error_api_error function called');
        experian_dispute_error_api_error();
        break;
    case 'experian_dispute_error_api_success':
        $log->error('experian_dispute_error_api_success function called');
        experian_dispute_error_api_success();
        break;
    case 'update_next_charge_date':
        $log->error('update_next_charge_date function called');
        update_next_charge_date();
        break;
    case 'update_inprogress_to_pending_equifax':
        $log->error('update_inprogress_to_pending_equifax function called');
        update_inprogress_to_pending_equifax();
        break;
    case 'send_mail_for_transunion_username_password_empty':
        $log->error('send_mail_for_transunion_username_password_empty function called');
        send_mail_for_transunion_username_password_empty();
        break;
    default:
        $log->error('Error :: Invalid mode');
        header('Content-Type: application/json');
        header("HTTP/1.1 400 Bad Request");
        $response = array('status' => false, 'message' => 'Invalid mode');
        echo json_encode($response);
        exit;
}



function database_conn()
{
    global $log;
    $hostname = '10.136.0.3';  // Database server
    $username = 'crmuser';  // Database username
    $password = 'H72TA6466ffffbLuYRq4Il1s'; // // Database password
    $database = 'crmcredi_crm';  // Database name

    // Create connection
    $conn = mysql_connect($hostname, $username, $password);

    // Check connection
    if (!$conn) {
        header("HTTP/1.1 500 Server Error");
        $log->error("Error :: Could not connect to the database");
        $response = array('status' => false, 'message' => 'Could not connect to the database: ' . mysql_error());
        echo json_encode($response);
        exit;
    }

    // Select the database
    $db_select = mysql_select_db($database, $conn);

    if (!$db_select) {
        header("HTTP/1.1 500 Server Error");
        $log->error("Error :: Could not select the database");
        $response = array('status' => false, 'message' => 'Could not select the database: ' . mysql_error());
        echo json_encode($response);
        exit;
    }

    $log->error("Database connection established");
    return $conn;
}


function get_equifax_user()
{
    global $log;
    $conn = database_conn();
    $skip = isset($_GET['skip']) ? $_GET['skip'] : 0;

    $log->error('get_equifax_user function is being executed');
    query_again:

    $data = [];

    // SQL query to get data where dispute_submit_status_creditkarma = 'Pending' and dow_stauts = 'accepted'
    $sql = "SELECT ad.automated_data_id,vcc.equifax_username, vcc.equifax_password, vcc.contact_id  FROM automated_data as ad join vtiger_contacts_credentials as vcc on ad.client_id = vcc.contact_id
            WHERE ad.auto_import_status_equifax LIKE 'Pending' AND date(ad.date_created) >= CURDATE() - INTERVAL 60 DAY
            ORDER BY ad.automated_data_id DESC LIMIT 1 OFFSET $skip;";

    // Execute the query
    $result = mysql_query($sql, $conn);

    // Check if query executed successfully
    if (!$result) {
        $log->error("Error :: Query failed: " . mysql_error());
        die('Query failed: ' . mysql_error());
    }

    // Fetch the data
    $row = mysql_fetch_assoc($result);

    // Check if data was found
    if ($row) {

        // Get the automated_data_id for updating
        $automated_data_id = $row['automated_data_id'];

        $data['client_id'] = $row['contact_id'];
        $data['username'] = decryptData($row['equifax_username']);
        $data['password'] = base64_encode(decryptData($row['equifax_password']));
        $data['skip'] = $skip;
        $data['status'] = true;
        $data['automated_data_id'] = $row['automated_data_id'];
    } else {
        $data['status'] = false;
        $data['skip'] = $skip;
    }


    if (isset($data['username']) && (strpos($data['username'], "canadacreditrepairs.ca") !== false) || (strpos($data['username'], "sbcccorp.com") !== false)) {

        // Update the status of the record to 'Inprogress'
        $update_sql = "UPDATE automated_data 
                    SET auto_import_status_equifax = 'Inprogress'
                    WHERE automated_data_id = $automated_data_id";

        if (mysql_query($update_sql, $conn)) {
            $log->error("Status updated to 'Inprogress' for automated_data_id $automated_data_id");

            $createddate = date('Y-m-d H:i:s');
            $message_date = date('m-d-Y h:i a');
            $notification_msg = "Auto Bot has picked this profile for Equifax import at $message_date";
            $client_id = $row['contact_id'];
            $sql_noti = "INSERT INTO vtiger_credit_notification (record_id, notification_msg,notification_type, createddate) VALUES ($client_id, '$notification_msg','autoimport', '$createddate')";
            $retval_noti = mysql_query($sql_noti, $conn);
        }
    } else if (isset($data['username'])) { // Username is exists but no same domain of email
        $update_sql = "UPDATE automated_data 
                    SET auto_import_status_equifax = 'Error', auto_import_status_text_equifax = 'No same domain of email'
                    WHERE automated_data_id = $automated_data_id";
        $log->error("error_experian_user Status updated to 'Error' for automated_data_id $update_sql");
        // Execute the update query
        if (mysql_query($update_sql, $conn)) {
            $log->error("error_experian_user Status (No same domain of email) updated to 'Error' for automated_data_id $automated_data_id");
        }

        $skip++;
        goto query_again;
    }

    $log->error("Got the data of user" . json_encode($data));
    // Close the connection when done
    mysql_close($conn);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function get_equifax_user_give_us_call()
{
    global $log;
    $conn = database_conn();
    $skip = isset($_GET['skip']) ? $_GET['skip'] : 0;

    $log->error('get_equifax_user_give_us_call function is being executed');
    query_again:

    $data = [];

    // SQL query to get data where dispute_submit_status_creditkarma = 'Pending' and dow_stauts = 'accepted'
    $sql = "SELECT ad.automated_data_id,vcc.equifax_username, vcc.equifax_password, vcc.contact_id  FROM equifax_give_us_call as ad join vtiger_contacts_credentials as vcc on ad.client_id = vcc.contact_id
            WHERE date(ad.created_at) >= CURDATE()
            LIMIT 1 OFFSET $skip;";

    // Execute the query
    $result = mysql_query($sql, $conn);

    // Check if query executed successfully
    if (!$result) {
        $log->error("Error :: Query failed: " . mysql_error());
        die('Query failed: ' . mysql_error());
    }

    // Fetch the data
    $row = mysql_fetch_assoc($result);

    // Check if data was found
    if ($row) {

        // Get the automated_data_id for updating
        $automated_data_id = $row['automated_data_id'];

        $data['client_id'] = $row['contact_id'];
        $data['username'] = decryptData($row['equifax_username']);
        $data['password'] = base64_encode(decryptData($row['equifax_password']));
        $data['skip'] = $skip;
        $data['status'] = true;
        $data['automated_data_id'] = $row['automated_data_id'];
        $data['source'] = "Give us call";
    } else {
        $data['status'] = false;
        $data['skip'] = $skip;
    }


    if (isset($data['username']) && strpos($data['username'], "canadacreditrepairs.ca") !== false) {

        // Update the status of the record to 'Inprogress'
        $update_sql = "UPDATE automated_data 
                    SET auto_import_status_equifax = 'Inprogress'
                    WHERE automated_data_id = $automated_data_id";

        // Execute the update query
        if (mysql_query($update_sql, $conn)) {
            $log->error("Status updated to 'Inprogress' for automated_data_id $automated_data_id");
            //echo "Status updated to 'Inprogress' for automated_data_id $automated_data_id";
        }
    } else if (isset($data['username'])) { // Username is exists but no same domain of email
        $skip++;
        goto query_again;
    }

    $log->error("Got the data of user" . json_encode($data));
    // Close the connection when done
    mysql_close($conn);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}


function store_equifax_data()
{
    global $log;
    $log->error('store_equifax_data function is being executed');
    if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_SERVER['CONTENT_TYPE']) && strpos($_SERVER['CONTENT_TYPE'], 'application/json') !== false) {
        $json_data = file_get_contents('php://input');
        $data = json_decode($json_data, true);
        $type = isset($data['type']) ? $data['type'] : 'collection';
        $log->error("Data received: ");
        $log->error($json_data);
        $log->error($data);
        switch ($type) {
            case 'collection':
                $log->error('collection function is being executed');
                add_collection($data);
                $log->error('collection function is completed');
                break;
            case 'inquiry':
                $log->error('inquiry function is being executed');
                add_inquiry($data);
                $log->error('inquiry function is completed');
                break;
            case 'installment_account':
                $log->error('installment_account function is being executed');
                add_accounts($data);
                $log->error('installment_account function is completed');
                break;
            case 'other_account':
                $log->error('other_account function is being executed');
                add_accounts($data);
                $log->error('other_account function is completed');
                break;
            case 'revolving_account':
                $log->error('revolving_account function is being executed');
                add_accounts($data);
                $log->error('revolving_account function is completed');
                break;
            case 'complete_process':
                $log->error('complete_process function is being executed');
                complete_process($data);
                $log->error('complete_process function is completed');
                break;
            case 'error_equifax_user':
                $log->error('complete_process function is being executed');
                error_equifax_user($data);
                $log->error('complete_process function is completed');
                break;

            case 'personal_information':
                $log->error('personal_information function is being executed');
                insert_personal_data($data);
                $log->error('personal_information function is completed');
                break;
            case 'dispute_page_address':
                $log->error('dispute_page_address function is being executed');
                dispute_page_address($data, 'Equifax');
                $log->error('dispute_page_address function is completed');
                break;
            case 'credit_score':
                $log->error('credit_score function is being executed');
                credit_score($data);
                $log->error('credit_score function is completed');
                break;
            case 'error_process_give_us_call':
                $log->error('error_process_give_us_call function is being executed');
                error_process_give_us_call($data);
                $log->error('error_process function is completed');
                break;
            default:
                $log->error('Error :: Invalid type in store');
                header('Content-Type: application/json');
                header("HTTP/1.1 400 Bad Request");
                $response = array('status' => false, 'message' => 'Invalid type');
                echo json_encode($response);
                exit;
        }

        // Return a JSON response
        header('Content-Type: application/json');
        $response = array('status' => true, 'message' => 'Data inserted successfully ' . $type);
        echo json_encode($response);
        exit;
    } else {
        $log->error('Error :: Invalid request in store_equifax_data ');
        header('Content-Type: application/json');
        header("HTTP/1.1 400 Bad Request");
        $response = array('status' => false, 'message' => 'Invalid request');
        echo json_encode($response);
    }
}

function complete_process($data)
{
    global $log;
    $automated_data_id = $data['automated_data_id'];

    // Create connection
    $conn = database_conn();

    $update_sql = "UPDATE automated_data 
    SET auto_import_status_equifax = 'Completed'
    WHERE automated_data_id = $automated_data_id";

    // Execute the update query
    if (mysql_query($update_sql, $conn)) {
        $log->error("-- Status updated to 'Completed' for automated_data_id $automated_data_id");
    }
}

function error_process_give_us_call($data)
{
    global $log;
    $automated_data_id = $data['automated_data_id'];
    $client_id = $data['client_id'];
    $created_at = date('Y-m-d');
    $ip_address = $data['ip_address'];
    // Create connection
    $conn = database_conn();

    // Check exists or not
    $check_already_result = mysql_query("SELECT * FROM `equifax_give_us_call` WHERE `automated_data_id` = '$automated_data_id'", $conn);
    if (mysql_num_rows($check_already_result) > 0) {
        $log->error("-- error_process_equifax exists for automated_data_id $automated_data_id");
        return;
    } else {
        $insert_query = 'Insert into equifax_give_us_call (automated_data_id, client_id, created_at, ip_address) values (' . $automated_data_id . ', ' . $client_id . ', "' . $created_at . '", "' . $ip_address . '")';

        // Execute the update query
        if (mysql_query($insert_query, $conn)) {
            $log->error("-- error_process_equifax inserted for automated_data_id $automated_data_id");
        }
    }
}
function add_accounts($data, $creditor = 'Equifax')
{
    global $log;
    // Create connection
    $conn = database_conn();

    $record_id = $data['record_id'];
    $open_accounts = $data['open_accounts'];
    $closed_accounts = isset($data['closed_accounts']) ? $data['closed_accounts'] : array();

    $account_name_array = [];

    $log->error('add_accounts function is being executed');
    $log->error('Record ID: ' . $record_id);

    foreach ($open_accounts as $open_account) {
        foreach ($open_account as $value) {


            $record_id = mysql_real_escape_string($data['record_id']);
            $creditor_name = mysql_real_escape_string($value['account_overview'][6]['original_creditor_name']); // Assuming data is missing, you can replace with real value
            $account_type = mysql_real_escape_string($value['account_overview'][3]['account_type']); // INSTALLMENT

            $account_name_array[] = $creditor_name;

            $account_number = mysql_real_escape_string($value['account_overview'][0]['account_number']); // Account number 
            $account_status = mysql_real_escape_string($value['account_overview'][1]['account_status']); // PAYS_AS_AGREED
            $payment_status = "-"; // You can set this from your JSON if available

            $worst_payment_status = '-';
            $open_date = date('Y-m-d H:i:s', strtotime(mysql_real_escape_string($value['account_date'][0]['date_opened']))); // Mar 29, 2024
            $times_days_late = "-"; // Can be computed or derived based on some logic

            $remarks = "-"; // Empty or can be extracted from JSON
            $credit_balance = mysql_real_escape_string($value['balance_and_amount'][0]['balance']); // $31,765
            $old_credit_balance = mysql_real_escape_string($value['balance_and_amount'][2]['high_credit']); // Replace if you have this info

            $previous_credit_balance = "-"; // Replace if you have this info
            $creditOrBalanceValue = "-"; // Replace as per requirement
            $new_remark = "-"; // Set based on your logic

            $dispute_status = "-"; // Replace based on requirement
            // Set this based on your logic
            $amount_of_late = "-"; // Based on your logic

            $display_status = "-"; // Replace as needed
            $current_late_count = "-"; // Derived value
            $updated_late_count = "-"; // Derived value

            $created_date = date("Y-m-d H:i:s"); // Current date/time
            $modified_date = date("Y-m-d H:i:s"); // Current date/time
            $tag = "-"; // Replace if you have this info

            $account_change = "-"; // Replace with info if you have it
            $block_type = "start"; // Replace if needed


            // New workout 
            $tag = '';
            $sql_dispute_status = "SELECT * FROM `vtiger_credit_repair` WHERE `client_id` = $record_id AND creditor='$creditor' AND block_type = '{$block_type}'";
            $result_dispute_status = mysql_query($sql_dispute_status, $conn);
            if (mysql_num_rows($result_dispute_status) > 0) {
                $tag = 'not-started';
            } else {
                $tag = 'started';
            }



            $sql_dispute = "SELECT * FROM `vtiger_credit_repair` WHERE `creditor_name` = '$creditor_name' AND `creditor`='$creditor' AND `open_date`='$open_date' AND `client_id` = $record_id AND block_type = '{$block_type}'";


            $result_dispute = mysql_query($sql_dispute, $conn);
            if (!$result_dispute) {
                $log->error('Error :: something went wrong while fetching record to check exsting or not, Method : addData() :  ' . mysql_error());
                die('something went wrong while fetching record to check exsting or not, Method : addData() :  ' . mysql_error());
            }

            if (mysql_num_rows($result_dispute) > 0) {
                $d_status = "Updated";
                $sql = "UPDATE vtiger_credit_repair SET creditor_name='{$creditor_name}',credit_balance='{$credit_balance}',account_type='$account_type',account_status='$account_status',"
                    . "payment_status='$payment_status',display_status='$d_status',
          open_date='$open_date',modified_date='$modified_date'  WHERE client_id=" . $record_id . " AND creditor_name='$creditor_name' AND creditor='$creditor' AND open_date='$open_date' AND block_type ='{$block_type}'";
                $result = mysql_query($sql);
                if (!$result) {
                    header("HTTP/1.1 500 Server Error");
                    $response = array('status' => false, 'message' => mysql_error());
                    echo json_encode($response);
                    exit;
                }
            } else {
                // Insert SQL query
                $query = "INSERT INTO vtiger_credit_repair (
        client_id, creditor_name, account_type, 
        account_number, account_status, payment_status, 
        worst_payment_status, open_date, times_days_late, 
        remarks, credit_balance, old_credit_balance, 
        previous_credit_balance, creditOrBalanceValue, new_remark, 
        despute_status, creditor, amount_of_late, 
        display_status, current_late_count, updated_late_count
        , created_date, modified_date, tag, 
        account_change, block_type) 
          VALUES ('{$record_id}', '{$creditor_name}', '{$account_type}',
                  '{$account_number}', '{$account_status}', '{$payment_status}',
                  '{$worst_payment_status}', '{$open_date}', '{$times_days_late}', 
                  '{$remarks}', '{$credit_balance}', '{$old_credit_balance}',
                  '{$previous_credit_balance}', '{$creditOrBalanceValue}', '{$new_remark}', 
                  '{$dispute_status}', '{$creditor}', '{$amount_of_late}',
                  '{$display_status}', '{$current_late_count}', '{$updated_late_count}'
                  , '{$created_date}', '{$modified_date}', '{$tag}',
                  '{$account_change}', '{$block_type}'
          )";

                // Execute the query
                $result = mysql_query($query);
                if (!$result) {
                    $log->error('Error :: inserting data into vtiger_credit_repair table: ' . mysql_error());
                    header("HTTP/1.1 500 Server Error");
                    $response = array('status' => false, 'message' => mysql_error());
                    echo json_encode($response);
                    exit;
                }
            }
        }
    }

    foreach ($closed_accounts as $closed_account) {
        foreach ($closed_account as $value) {
            $value = $value;

            $record_id = mysql_real_escape_string($data['record_id']);
            $creditor_name = mysql_real_escape_string($value['account_overview'][6]['original_creditor_name']);
            $account_type = mysql_real_escape_string($value['account_overview'][3]['account_type']);

            $account_name_array[] = $creditor_name;

            $account_number = mysql_real_escape_string($value['account_overview'][0]['account_number']);
            $account_status = mysql_real_escape_string($value['account_overview'][1]['account_status']);
            $payment_status = "-";

            $worst_payment_status = '-';  //Leave
            $open_date = date('Y-m-d H:i:s', strtotime(mysql_real_escape_string($value['account_date'][0]['date_opened'])));
            $times_days_late = "-"; //Leave

            $remarks = "--";  //Leave
            $credit_balance = mysql_real_escape_string($value['balance_and_amount'][0]['balance']);
            $old_credit_balance = "";  //Leave

            $previous_credit_balance = "-";  //Leave
            $creditOrBalanceValue = "-"; //Leave
            $new_remark = "-"; //Leave

            $dispute_status = "-";
            $amount_of_late = "-";

            $display_status = "New";
            $current_late_count = "-";
            $updated_late_count = "-";

            $created_date = date("Y-m-d H:i:s");
            $modified_date = date("Y-m-d H:i:s");
            $tag = "-";

            $account_change = "-";
            $block_type = "closed";

            $tag = '';
            $sql_dispute_status = "SELECT * FROM `vtiger_credit_repair` WHERE `client_id` = $record_id AND creditor='$creditor' and block_type = '{$block_type}' ";
            $result_dispute_status = mysql_query($sql_dispute_status, $conn);
            if (mysql_num_rows($result_dispute_status) > 0) {
                $tag = 'not-started';
            } else {
                $tag = 'started';
            }

            $sql_dispute = "SELECT * FROM `vtiger_credit_repair` WHERE `creditor_name` = '$creditor_name' AND `creditor`='$creditor' AND `open_date`='$open_date' AND `client_id` = $record_id AND block_type = '{$block_type}'";


            $result_dispute = mysql_query($sql_dispute, $conn);
            if (!$result_dispute) {
                $log->error('Error :: something went wrong while fetching record to check exsting or not, Method : addData() :  ' . mysql_error());
                die('something went wrong while fetching record to check exsting or not, Method : addData() :  ' . mysql_error());
            }

            if (mysql_num_rows($result_dispute) > 0) {
                $d_status = "Updated";
                $sql = "UPDATE vtiger_credit_repair SET creditor_name='{$creditor_name}',credit_balance='{$credit_balance}',account_type='$account_type',account_status='$account_status',"
                    . "payment_status='$payment_status',display_status='$d_status',
          open_date='$open_date',modified_date='$modified_date'  WHERE client_id=" . $record_id . " AND creditor_name='$creditor_name' AND creditor='$creditor' AND open_date='$open_date' AND block_type = '{$block_type}'";
                $result = mysql_query($sql);
                if (!$result) {
                    header("HTTP/1.1 500 Server Error");
                    $response = array('status' => false, 'message' => mysql_error());
                    echo json_encode($response);
                    exit;
                }
            } else {
                $query = "INSERT INTO vtiger_credit_repair (
      client_id, creditor_name, account_type, 
      account_number, account_status, payment_status, 
      worst_payment_status, open_date, times_days_late, 
      remarks, credit_balance, old_credit_balance, 
      previous_credit_balance, creditOrBalanceValue, new_remark, 
      despute_status, creditor, amount_of_late, 
      display_status, current_late_count, updated_late_count
      , created_date, modified_date, tag, 
      account_change, block_type) 
        VALUES ('{$record_id}', '{$creditor_name}', '{$account_type}',
                '{$account_number}', '{$account_status}', '{$payment_status}',
                '{$worst_payment_status}', '{$open_date}', '{$times_days_late}', 
                '{$remarks}', '{$credit_balance}', '{$old_credit_balance}',
                '{$previous_credit_balance}', '{$creditOrBalanceValue}', '{$new_remark}', 
                '{$dispute_status}', '{$creditor}', '{$amount_of_late}',
                '{$display_status}', '{$current_late_count}', '{$updated_late_count}'
                , '{$created_date}', '{$modified_date}', '{$tag}',
                '{$account_change}', '{$block_type}'
        )";

                // Execute the query
                $result = mysql_query($query);
                if (!$result) {
                    $log->error('Error :: inserting data into vtiger_credit_repair table: ' . mysql_error());
                    header("HTTP/1.1 500 Server Error");
                    $response = array('status' => false, 'message' => mysql_error());
                    echo json_encode($response);
                    exit;
                }
            }
        }
    }

    check_exist($account_name_array, 'Equifax', $record_id);

}


function add_inquiry($data, $creditor = 'Equifax')
{
    global $log;
    $log->error('add_inquiry function is being executed');
    $log->error($data);
    // Create connection
    $conn = database_conn();

    $record_id = $data['record_id'];
    $hard_inquires = isset($data['hard_inquires']) ? $data['hard_inquires'] : array();
    $soft_inquires = isset($data['soft_inquires']) ? $data['soft_inquires'] : array();

    foreach ($hard_inquires as $value) {

        $inquiry_name = mysql_real_escape_string($value['company']);
        $inquiry_date = mysql_real_escape_string($value['date']);


        $check_already_sql = "SELECT * FROM `inquiry` WHERE `provide_by` = '$creditor' AND `record_id`='$record_id'";

        $check_already_result = mysql_query($check_already_sql, $conn);
        if (mysql_num_rows($check_already_result) > 0) {
            $tag = 'not-started';
            $block_type = 'new';
        } else {
            $tag = 'started';
            $block_type = 'inquiry';
        }


        if ($inquiry_date != '' && $inquiry_name != '') {

            $alresy_exist = check_inquiry_exsit($inquiry_name, $creditor, $inquiry_date, $record_id);
            if ($alresy_exist) {
                // echo "$m -> inquiry already exist";
            } else {
                $sql = "INSERT INTO inquiry (
                        inquiry_name, inquiry_date, inquiry_expire_date, 
                        record_id, provide_by, createddate, tag, block_type
                    )
                    VALUES (
                        '$inquiry_name', '$inquiry_date', '', 
                        '$record_id', '$creditor', '" . date('Y-m-d H:i:s') . "', '{$tag}', '{$block_type}'
                    )";

                $result = mysql_query($sql, $conn);

                if (!$result) {
                    $log->error('Error :: inserting data into inquiry table: ' . mysql_error());
                    header("HTTP/1.1 500 Server Error");
                    $response = array('status' => false, 'message' => mysql_error());
                    echo json_encode($response);
                    exit;
                }
            }
        }
    }

    foreach ($soft_inquires as $value) {

        $inquiry_name = mysql_real_escape_string($value['company']);
        $inquiry_date = mysql_real_escape_string($value['date']);

        $check_already_sql = "SELECT * FROM `inquiry` WHERE `provide_by` = '$creditor' AND `record_id`='$record_id'";

        $check_already_result = mysql_query($check_already_sql, $conn);
        if (mysql_num_rows($check_already_result) > 0) {
            $tag = 'not-started';
            $block_type = 'new';
        } else {
            $tag = 'started';
            $block_type = 'inquiry';
        }


        if ($inquiry_date != '' && $inquiry_name != '') {
            $alresy_exist = check_inquiry_exsit($inquiry_name, $creditor, $inquiry_date, $record_id);
            if ($alresy_exist) {
                // echo "$m -> inquiry already exist";
            } else {
                $sql = "INSERT INTO inquiry (
                        inquiry_name, inquiry_date, inquiry_expire_date, 
                        record_id, provide_by, createddate, tag, block_type
                    )
                    VALUES (
                        '$inquiry_name', '$inquiry_date', '', 
                        '$record_id', '$creditor', '" . date('Y-m-d H:i:s') . "', '{$tag}', '{$block_type}'
                    )";

                $result = mysql_query($sql, $conn);

                if (!$result) {
                    $log->error('Error :: inserting data into inquiry table: ' . mysql_error());
                    header("HTTP/1.1 500 Server Error");
                    $response = array('status' => false, 'message' => mysql_error());
                    echo json_encode($response);
                    exit;
                }
            }
        }
    }

    // Close connection
    mysql_close($conn);
}

function check_inquiry_exsit($inq_name, $provide_by, $inq_date, $record_id)
{
    // Create connection
    $conn = database_conn();

    $check_already_sql = "SELECT * FROM `inquiry` WHERE `provide_by` = '$provide_by' AND `record_id`='$record_id' AND `inquiry_name` = '$inq_name' AND `inquiry_date`='$inq_date'";

    $check_already_result = mysql_query($check_already_sql, $conn);
    if (mysql_num_rows($check_already_result) > 0) {
        return TRUE;
    } else {
        return FALSE;
    }
}

function add_collection($data, $creditor = 'Equifax')
{
    global $log;
    $record_id = $data['record_id'];
    $data = $data['collection_details'];
    $data = array_merge(...$data);

    $collection_agency = mysql_real_escape_string($data['collection_agency']);
    $original_creditor_name = mysql_real_escape_string($data['original_creditor_name']);
    $date_assigned = mysql_real_escape_string($data['date_assigned']);
    $original_amount_owed = mysql_real_escape_string($data['original_amount_owed']);
    $amount = mysql_real_escape_string($data['amount']);
    $comments = mysql_real_escape_string($data['comments']);
    $date_assigned = date('Y-m-d', strtotime($date_assigned));
    $status = mysql_real_escape_string($data['status']);

    // Create connection
    $conn = database_conn();

    //Tags check
    $result_dispute_count = mysql_query($sql_dispute_count, $conn);
    if (mysql_num_rows($result_dispute_count) > 0) {
        $tag = 'not-started';
    } else {
        $tag = 'started';
    }

    //Dispute status
    $sql_dispute_status = "SELECT * FROM `vtiger_public_record` WHERE `record_id` = $record_id ";
    $dispute_status_data = "New";
    $result_dispute_status = mysql_query($sql_dispute_status, $conn);
    if (!$result_dispute_status) {
        $log->error('Error :: collection table: ' . mysql_error());
        die('Could not enter data c3:  ' . mysql_error());
    }
    if (mysql_num_rows($result_dispute_status) > 0) {
        $dispute_status_data = "Initial";
    }
    $accountStatus = "Open";

    $sql_dispute = "SELECT * FROM `vtiger_public_record` WHERE `agency_name` = '$collection_agency' AND `provide_by` = '$creditor' AND `record_id`='$record_id' AND  Date(`opened_date`)='$date_assigned'";


    $result_dispute = mysql_query($sql_dispute, $conn);
    if (!$result_dispute) {
        $log->error('Error :: collection table: ' . mysql_error());
        header("HTTP/1.1 500 Server Error");
        $response = array('status' => false, 'message' => mysql_error());
        echo json_encode($response);
        exit;
    }

    if (mysql_num_rows($result_dispute) > 0) {
        while ($row = mysql_fetch_array($result_dispute)) {
            $public_record_id = trim($row["public_record_id"]);
            $sql = "UPDATE vtiger_public_record SET agency_name='$collection_agency',agency_status='$accountStatus',agency_balance='$original_amount_owed',agency_remark='$comments',"
                . "original_creditor='$original_creditor_name',opened_date='$date_assigned',modified_date='" . date('Y-m-d H:i:s') . "' WHERE public_record_id=" . $public_record_id;
        }

        $result = mysql_query($sql, $conn);
        if (!$result) {
            $log->error('Error :: collection table: ' . mysql_error());
            header("HTTP/1.1 500 Server Error");
            $response = array('status' => false, 'message' => mysql_error());
            echo json_encode($response);
            exit;
        }
    } else {

        $sql = "INSERT INTO vtiger_public_record (
            agency_name, agency_status, agency_balance, creditOrBalanceValue, agency_remark,
            original_creditor, opened_date, despute_status, display_status, createddate, 
            record_id, provide_by, modified_date, block_type, tag
        ) 
        VALUES (
            '{$collection_agency}', '{$accountStatus}', '{$original_amount_owed}', '{$amount}', '{$comments}', 
            '{$original_creditor_name}', '{$date_assigned}', '{$dispute_status_data}', '', '" . date('Y-m-d H:i:s') . "', 
            $record_id, '$creditor', '" . date('Y-m-d H:i:s') . "', 'Collection', '{$tag}'
        )";

        $result = mysql_query($sql, $conn);

        // Check if the query was successful
        if (!$result) {
            $log->error('Error :: inserting data into collection table: ' . mysql_error());
            header("HTTP/1.1 500 Server Error");
            $response = array('status' => false, 'message' => mysql_error());
            echo json_encode($response);
            exit;
        }
    }

    // Close the connection when done
    mysql_close($conn);
}

function insert_personal_data($data, $creditor = 'Equifax')
{
    global $log;
    $conn = database_conn();
    $record_id = $data['record_id'];
    $created_date = date('Y-m-d H:i:s');

    $log->error('insert_personal_data function is being executed');
    $log->error($creditor);
    $log->error($data);

    foreach ($data['identification'] as $k => $identification_value) {
        foreach ($identification_value as $key => $value) {
            $field_name = '';
            if ($key == 'Social Security Number') {
                $field_name = 'Social Security';
            } else if ($key == 'Date of Birth') {
                $field_name = 'DOB';
            } else if ($key == 'Name') {
                $field_name = $key;
            }

            if ($field_name != '') {
                $sql = "SELECT * FROM `vtiger_personal_info` where field_value ='$value' and creditor= '$creditor' and contact_id ='$record_id' and is_deleted = 'no'";
                $result = mysql_query($sql, $conn);

                if (mysql_num_rows($result) > 0) {
                } else {
                    $sql_insert = "INSERT INTO vtiger_personal_info (contact_id, field_name, field_value, is_deleted, creditor, created_date,updated_date) VALUES ('$record_id', '$field_name', '$value', 'no','$creditor','$created_date','$created_date');";
                    $log->error($sql_insert);
                    $result_insert = mysql_query($sql_insert, $conn);
                    if (!$result_insert) {
                        $log->error('Error :: inserting data into personal info table: ' . mysql_error());
                        header("HTTP/1.1 500 Server Error");
                        $response = array('status' => false, 'message' => mysql_error());
                        echo json_encode($response);
                        exit;
                    }
                }
            }
        }
    }

    foreach ($data['contact_information'] as $val) {

        $field_name = 'address';
        $value = $val['address'];

        $sql = "SELECT * FROM `vtiger_personal_info` where field_value ='$value' and creditor= '$creditor' and contact_id ='$record_id' and is_deleted = 'no'";
        $result = mysql_query($sql, $conn);

        if (mysql_num_rows($result) > 0) {
        } else {
            $sql_insert = "INSERT INTO vtiger_personal_info (contact_id, field_name, field_value, is_deleted, creditor, created_date,updated_date) VALUES ('$record_id', '$field_name', '$value', 'no','$creditor','$created_date','$created_date');";
            $log->error($sql_insert);

            $result_insert = mysql_query($sql_insert, $conn);
            if (!$result_insert) {
                $log->error('Error :: inserting data into personal info table: ' . mysql_error());
                header("HTTP/1.1 500 Server Error");
                $response = array('status' => false, 'message' => mysql_error());
                echo json_encode($response);
                exit;
            }
        }
    }
}

function credit_score($data, $provide_by = 'Equifax')
{
    global $log;
    $record_id = $data['record_id'];
    $created_date = date('Y-m-d H:i:s');
    $credit_score = $data['credit_score'];



    $conn = database_conn();

    if ($data['credit_usage']) {
        $hard_inquiries_impact = $hard_inquiries = $total_accounts_impact = $total_accounts = $derogatory_marks_impact = $derogatory_marks = $credit_age_impact = $credit_age = $credit_card_use_impact = $credit_card_use = $payment_history_impact = $payment_history = '';
        $createddate = date('Y-m-d H:i:s');

        $credit_card_use = $data['credit_usage'];
        $credit_card_use = trim($credit_card_use);
        $sqli = "INSERT INTO credit_factor (client_id, provider, hard_inquiries, total_accounts,credit_age,derogatory_marks,credit_card_use,payment_history,hard_inquiries_impact,total_accounts_impact,credit_age_impact,derogatory_marks_impact,credit_card_use_impact,payment_history_impact,createddate)
        VALUES ('$record_id','$provide_by','$hard_inquiries','$total_accounts','$credit_age','$derogatory_marks','$credit_card_use','$payment_history','$hard_inquiries_impact','$total_accounts_impact','$credit_age_impact','$derogatory_marks_impact','$credit_card_use_impact','$payment_history_impact','$createddate')";
        $log->error('---- sql query for factor ----');
        $log->error($sqli);
        $retval = mysql_query($sqli, $conn);
        $log->error($credit_card_use);
        $credit_card_use = str_replace('%', '', $credit_card_use);
        $credit_card_use = (int) $credit_card_use;
        $log->error($credit_card_use);
        if ($credit_card_use > 40) {
            $log->error($credit_card_use . ' -- credit_card_use -- ' . $record_id);
            sendmail_creditcard_use($record_id, $credit_card_use);
        }

    }

    $sql = "SELECT * FROM `vtiger_credit_score` WHERE `client_id` = '$record_id' AND `provider` = '$provide_by' ";
    $result = mysql_query($sql, $conn);

    if (!$result) {
        $log->error('Error :: inserting data into credit score table: ' . mysql_error());
        header("HTTP/1.1 500 Server Error");
        $response = array('status' => false, 'message' => mysql_error());
        echo json_encode($response);
        exit;
    }
    if (mysql_num_rows($result) > 0) {
        $sqli = "INSERT INTO vtiger_credit_score (client_id, score, provider, createddate)
      VALUES ('$record_id', '$credit_score','$provide_by', '$created_date')";
        $retval = mysql_query($sqli, $conn);

        if (!$retval) {
            $log->error('Error :: inserting data into credit score table: ' . mysql_error());
            header("HTTP/1.1 500 Server Error");
            $response = array('status' => false, 'message' => mysql_error());
            echo json_encode($response);
            exit;
        }
    } else {
        $sqli = "INSERT INTO vtiger_credit_score (client_id, score, provider, createddate)
      VALUES ('$record_id', '$credit_score','$provide_by', '$created_date')";
        $retval = mysql_query($sqli, $conn);

        if (!$retval) {
            $log->error('Error :: inserting data into credit score table: ' . mysql_error());
            header("HTTP/1.1 500 Server Error");
            $response = array('status' => false, 'message' => mysql_error());
            echo json_encode($response);
            exit;
        }
    }
}

function get_transunion_user()
{
    global $log;
    $conn = database_conn();
    $skip = isset($_GET['skip']) ? $_GET['skip'] : 0;
    $data1 = [];
    $log->error('get_transunion_user function is being executed');
    query_again:

    $data = [];

    $sql = "SELECT ad.date_created,ad.automated_data_id,vcc.transunion_username, vcc.transunion_password, vcc.contact_id  FROM automated_data as ad join vtiger_contacts_credentials as vcc on ad.client_id = vcc.contact_id
            WHERE ad.auto_import_status_transunion LIKE 'Pending'  AND 
            (
            date(ad.date_created) >= CURDATE() - INTERVAL 60 DAY OR
            automated_data_id IN (293809,302856,302589,302395,304928,302557,302578,304916,304994,304934,294020,304926,294816,303139,299558,302850,304992,302860,304997,302386,286327,302565,304667,303693,304084,302583,298065,304031,302845,305159,302838,303870,303393,304296,303704,295002,302561,304303,303132,304292,302401,302397,295544,304988,290646,302570,302387,302842,302406,302382,304805,303388,303241,303384,304991,281792,304077,302567,304925,305193,303137,304309,304287,303254,302400,303690,304100,302859,300403,303379,303707,302556,300165,290393,304082,303373,302566,302388,290394,302843,303710,304940,304091,303250,304306,304105,304993,301242,304293,304989,303701,305004,304939,303242,304093,303255,304998,303130,303473,194554,300675,302841,302829,304300,303703,302571,303377,299216,303806,302849,302384,302864,270318,304919,303143,302569,302936,303394,304927,302568,305000,303383,303389,286468,302394,303692,304101,297959,304086,292868,302404,303700,303691,302858,294815,302407,299725,303398,304099,305001,304937,304929,302865,302844,302564,302389,304575,303378,302840,303375,303686,303689,303688,304290,303397,304930,297122,302396,304097,297123,302582,304931,304284,304103,304307,303683,302558,302862,304945,302587,303714,304921,295546,305003,302867,304933,302863,303252,302579,304946,305234,302861,303127,302868,304917,302393,304090,298933,303133,302839,304289,304308,303407,303134,303244,303709,303126,303685,297845,303386,302409,304943,303256,302588,303807,302403,303706,304936,303403,303142,302853,302563,304942,304282,304089,304297,304295,302408,303695,304095,304941,304528,301243,304283,304920,302847,297424,304787,303047,304085,303708,303687,304918,304078,303125,304285,305241,303387,299614,303240,304079,303251,303808,303124,304731,304990,302835,303705,303374,304519,304935,304924,304080,305194,304098,303694,302560,305107,303243,302581,302559,303239,303810,304599,303699,303809)
            )  
            ORDER BY ad.automated_data_id DESC LIMIT 1 OFFSET $skip;";
    //

    // Execute the query
    $result = mysql_query($sql, $conn);

    // Check if query executed successfully
    if (!$result) {
        $log->error("Error :: Query failed: " . mysql_error());
        die('Query failed: ' . mysql_error());
    }
    // Fetch the data
    $row = mysql_fetch_assoc($result);

    // Check if data was found
    if ($row) {

        // Get the automated_data_id for updating
        $automated_data_id = $row['automated_data_id'];

        $data['client_id'] = $row['contact_id'];
        $data['username'] = decryptData($row['transunion_username']);
        $data['password'] = base64_encode(decryptData($row['transunion_password']));
        $data['skip'] = $skip;
        $data['status'] = true;
        $data['automated_data_id'] = $automated_data_id;
        $data['date_created'] = $row['date_created'];
        $data['accounts'] = [];
        $data1[] = $data;
    } else {
        $data['status'] = false;
        $data['skip'] = $skip;

        $update_sql = "UPDATE `automated_data` set auto_import_status_transunion = 'Pending', auto_import_status_text_transunion = '' where (date(date_created) >= CURDATE() - INTERVAL 3 DAY) and ((auto_import_status_transunion like 'Error' AND auto_import_status_text_transunion LIKE 'OTP not valid.') OR auto_import_status_transunion like 'Inprogress');";
        if (mysql_query($update_sql, $conn)) {
            $log->error("Update in pending status for records older than 3 days with 'Error' status");
            //echo "Status updated to 'Inprogress' for automated_data_id $automated_data_id";
        }
    }


    if (isset($data['username'])) {

        // Update the status of the record to 'Inprogress'
        $update_sql = "UPDATE automated_data 
                    SET auto_import_status_transunion = 'Inprogress', auto_import_status_text_transunion = 'Work in progress'
                    WHERE automated_data_id = $automated_data_id";
        $createddate = date('Y-m-d H:i:s');
        $message_date = date('m-d-Y h:i a');
        $notification_msg = "Auto Bot has picked this profile for Transunion import at $message_date";
        $client_id = $row['contact_id'];
        $sql_noti = "INSERT INTO vtiger_credit_notification (record_id, notification_msg,notification_type, createddate) VALUES ($client_id, '$notification_msg','autoimport', '$createddate')";
        $retval_noti = mysql_query($sql_noti, $conn);
        // Execute the update query
        if (mysql_query($update_sql, $conn)) {
            $log->error("Status updated to 'Inprogress' for automated_data_id $automated_data_id");
            //echo "Status updated to 'Inprogress' for automated_data_id $automated_data_id";
        }
    }

    $log->error("Got the data of user" . json_encode($data));
    // Close the connection when done
    mysql_close($conn);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function get_transunion_user_1()
{
    global $log;
    $conn = database_conn();
    $skip = isset($_GET['skip']) ? $_GET['skip'] : 0;
    $data1 = [];
    $log->error('get_transunion_user function is being executed');
    query_again:

    $data = [];

    $sql = "SELECT ad.date_created,ad.automated_data_id,vcc.transunion_username, vcc.transunion_password, vcc.contact_id  FROM automated_data as ad join vtiger_contacts_credentials as vcc on ad.client_id = vcc.contact_id
            WHERE ad.auto_import_status_transunion LIKE 'Pending'  AND date(ad.date_created) >= CURDATE()  
            LIMIT 1 OFFSET $skip;";
    //

    // Execute the query
    $result = mysql_query($sql, $conn);

    // Check if query executed successfully
    if (!$result) {
        $log->error("Error :: Query failed: " . mysql_error());
        die('Query failed: ' . mysql_error());
    }
    // Fetch the data
    $row = mysql_fetch_assoc($result);

    // Check if data was found
    if ($row) {

        // Get the automated_data_id for updating
        $automated_data_id = $row['automated_data_id'];

        $data['client_id'] = $row['contact_id'];
        $data['username'] = decryptData($row['transunion_username']);
        $data['password'] = base64_encode(decryptData($row['transunion_password']));
        $data['skip'] = $skip;
        $data['status'] = true;
        $data['automated_data_id'] = $automated_data_id;
        $data['date_created'] = $row['date_created'];
        $data['accounts'] = [];
        $data1[] = $data;
    } else {
        $data['status'] = false;
        $data['skip'] = $skip;
    }


    if (isset($data['username'])) {

        // Update the status of the record to 'Inprogress'
        $update_sql = "UPDATE automated_data 
                    SET auto_import_status_transunion = 'Inprogress', auto_import_status_text_transunion = 'Work in progress'
                    WHERE automated_data_id = $automated_data_id";
        $createddate = date('Y-m-d H:i:s');
        $message_date = date('m-d-Y h:i a');
        $notification_msg = "Auto Bot has picked this profile for Transunion import at $message_date";
        $client_id = $row['contact_id'];
        $sql_noti = "INSERT INTO vtiger_credit_notification (record_id, notification_msg,notification_type, createddate) VALUES ($client_id, '$notification_msg','autoimport', '$createddate')";
        $retval_noti = mysql_query($sql_noti, $conn);

        // Execute the update query
        if (mysql_query($update_sql, $conn)) {
            $log->error("Status updated to 'Inprogress' for automated_data_id $automated_data_id");
            //echo "Status updated to 'Inprogress' for automated_data_id $automated_data_id";
        }
    }

    $log->error("Got the data of user" . json_encode($data));
    // Close the connection when done
    mysql_close($conn);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}


function store_transunion_data()
{
    global $log;
    $log->error('store_transunion_data function is being executed');
    if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_SERVER['CONTENT_TYPE']) && strpos($_SERVER['CONTENT_TYPE'], 'application/json') !== false) {
        $json_data = file_get_contents('php://input');
        $data = json_decode($json_data, true);
        $type = isset($data['type']) ? $data['type'] : '';

        $log->error('store_transunion_data data');
        $log->error($data);
        $log->error(json_encode($data));

        $record_id = isset($data['record_id']) ? $data['record_id'] : '';
        if ($type != '' && $type != 'error_process' && $record_id != '') {
            $log->error('store_transunion_data function is being executed & updated before calling function');
            $conn = database_conn();
            $sql_update = "UPDATE `vtiger_contactscf` SET `cf_1203` = '0', `cf_1207` = '' WHERE `contactid` = $record_id";
            $log->error($sql_update);
            $res_update = mysql_query($sql_update, $conn);
        }

        switch ($type) {
            case 'inquiry':
                $log->error('inquiry function is being executed');
                add_inquiry($data, 'Transunion');
                $log->error('inquiry function is completed');
                break;
            case 'accounts':
                $log->error('other_account function is being executed');
                add_accounts_transunion($data);
                $log->error('other_account function is completed');
                break;
            case 'complete_process':
                $log->error('complete_process_transunion function is being executed');
                complete_process_transunion($data);
                $log->error('complete_process_transunion function is completed');
                break;
            case 'error_process':
                $log->error('error_process_transunion function is being executed');
                error_process_transunion($data);
                $log->error('error_process_transunion function is completed');
                break;
            case 'personal_information':
                $log->error('personal_information function is being executed');
                insert_personal_data($data, 'Transunion');
                $log->error('personal_information function is completed');
                break;
            case 'credit_score':
                $log->error('credit_score function is being executed');
                credit_score($data, 'TransUnion');
                $log->error('credit_score function is completed');
                break;
            case 'error_credit_repair':
                $log->error('error_credit_repair function is being executed');
                error_credit_repair($data);
                $log->error('error_credit_repair function is completed');
                break;
            case 'success_credit_repair':
                $log->error('success_credit_repair function is being executed');
                success_credit_repair($data);
                $log->error('success_credit_repair function is completed');
                break;
            case 'get_creditpair_accounts':
                $log->error('get_creditpair_accounts function is being executed');
                get_creditpair_accounts($data);
                $log->error('get_creditpair_accounts function is completed');
                break;
            case 'dispute_update_data':
                $log->error('dispute_update_data function is being executed');
                dispute_update_data($data, 'TransUnion');
                $log->error('dispute_update_data function is completed');
                break;
            default:
                $log->error('Error :: Invalid type in store');
                header('Content-Type: application/json');
                header("HTTP/1.1 400 Bad Request");
                $response = array('status' => false, 'message' => 'Invalid type');
                echo json_encode($response);
                exit;
        }

        // Return a JSON response
        header('Content-Type: application/json');
        $response = array('status' => true, 'message' => 'Data inserted successfully');
        echo json_encode($response);
        exit;
    } else {
        $log->error('Error :: Invalid request in store_equifax_data ');
        header('Content-Type: application/json');
        header("HTTP/1.1 400 Bad Request");
        $response = array('status' => false, 'message' => 'Invalid request');
        echo json_encode($response);
    }
}


function pre($data, $flag = '')
{
    echo "<pre>";
    if ($flag == '') {
        print_r($data);
        exit;
    } else {
        print_r($data);
    }
}


function add_accounts_transunion($data)
{
    global $log;
    // Create connection
    $conn = database_conn();
    $account_name_array = [];

    $record_id = $data['record_id'];
    $accounts = isset($data['accounts']) ? $data['accounts'] : array();


    $log->error('add_accounts_transunion function is being executed');
    $log->error('Record ID: ' . $record_id);

    foreach ($accounts as $value) {
        //(isset($value['date_closed']) && !empty($value['date_closed'])) || 
        if (stripos($value['pay_status'], "past due date") !== false) {
            $log->error('add_accounts_transunion function is being executed account is ' . $value['account_name']);
            $log->error($value);
            $record_id = mysql_real_escape_string($data['record_id']);
            $creditor_name = mysql_real_escape_string($value['account_name']); // Assuming data is missing, you can replace with real value
            $account_type = mysql_real_escape_string($value['account_type']); // INSTALLMENT

            $account_name_array[] = $creditor_name;

            $account_number = mysql_real_escape_string(isset($value['account_number']) ? $value['account_number'] : ''); // Account number 
            $account_status = mysql_real_escape_string(isset($value['account_status']) ? $value['account_status'] : ''); // PAYS_AS_AGREED
            $payment_status = mysql_real_escape_string($value['pay_status']);
            $payment_status = str_replace(['<', '>'], '', $payment_status);

            $worst_payment_status = '-';
            $open_date = date('Y-m-d H:i:s', strtotime(mysql_real_escape_string($value['date_opened']))); // Mar 29, 2024
            $times_days_late = "-"; // Can be computed or derived based on some logic

            $remarks = mysql_real_escape_string($value['remarks']); // Empty or can be extracted from JSON
            $credit_balance = mysql_real_escape_string($value['balance']); // $31,765
            $old_credit_balance = mysql_real_escape_string($value['high_balance']); // Replace if you have this info

            $previous_credit_balance = "-"; // Replace if you have this info
            $creditOrBalanceValue = "-"; // Replace as per requirement
            $new_remark = "-"; // Set based on your logic

            $dispute_status = "-"; // Replace based on requirement
            $creditor = 'Transunion'; // Set this based on your logic
            $amount_of_late = "-"; // Based on your logic

            $current_late_count = "-"; // Derived value
            $updated_late_count = "-"; // Derived value

            $created_date = date("Y-m-d H:i:s"); // Current date/time
            $modified_date = date("Y-m-d H:i:s"); // Current date/time
            $tag = "-"; // Replace if you have this info

            $account_change = "-"; // Replace with info if you have it
            if (isset($value['date_closed']) && !empty($value['date_closed'])) {
                $display_status = "New"; // Replace as needed
                $block_type = "closed"; // Replace if needed 
            } else {
                $display_status = "-"; // Replace as needed
                $block_type = "start"; // Replace if needed
            }


            // New workout 
            $tag = '';
            $sql_dispute_status = "SELECT * FROM `vtiger_credit_repair` WHERE `client_id` = $record_id AND creditor='$creditor' AND block_type = '{$block_type}'";
            $result_dispute_status = mysql_query($sql_dispute_status, $conn);
            if (mysql_num_rows($result_dispute_status) > 0) {
                $tag = 'not-started';
            } else {
                $tag = 'started';
            }



            $sql_dispute = "SELECT * FROM `vtiger_credit_repair` WHERE `creditor_name` = '$creditor_name' AND `creditor`='$creditor' AND `open_date`='$open_date' AND `client_id` = $record_id AND block_type = '{$block_type}'";


            $result_dispute = mysql_query($sql_dispute, $conn);
            if (!$result_dispute) {
                $log->error('Error :: something went wrong while fetching record to check exsting or not, Method : addData() :  ' . mysql_error());
                die('something went wrong while fetching record to check exsting or not, Method : addData() :  ' . mysql_error());
            }

            if (mysql_num_rows($result_dispute) > 0) {
                $d_status = "Updated";
                $sql = "UPDATE vtiger_credit_repair SET creditor_name='{$creditor_name}',credit_balance='{$credit_balance}',account_type='$account_type',account_status='$account_status',"
                    . "payment_status='$payment_status',display_status='$d_status',
          open_date='$open_date',modified_date='$modified_date'  WHERE client_id=" . $record_id . " AND creditor_name='$creditor_name' AND creditor='$creditor' AND open_date='$open_date' AND block_type ='{$block_type}'";
                $result = mysql_query($sql);
                if (!$result) {
                    header("HTTP/1.1 500 Server Error");
                    $response = array('status' => false, 'message' => mysql_error());
                    echo json_encode($response);
                    exit;
                }
            } else {
                // Insert SQL query
                $query = "INSERT INTO vtiger_credit_repair (
                client_id, creditor_name, account_type, 
                account_number, account_status, payment_status, 
                worst_payment_status, open_date, times_days_late, 
                remarks, credit_balance, old_credit_balance, 
                previous_credit_balance, creditOrBalanceValue, new_remark, 
                despute_status, creditor, amount_of_late, 
                display_status, current_late_count, updated_late_count
                , created_date, modified_date, tag, 
                account_change, block_type) 
                VALUES ('{$record_id}', '{$creditor_name}', '{$account_type}',
                  '{$account_number}', '{$account_status}', '{$payment_status}',
                  '{$worst_payment_status}', '{$open_date}', '{$times_days_late}', 
                  '{$remarks}', '{$credit_balance}', '{$old_credit_balance}',
                  '{$previous_credit_balance}', '{$creditOrBalanceValue}', '{$new_remark}', 
                  '{$dispute_status}', '{$creditor}', '{$amount_of_late}',
                  '{$display_status}', '{$current_late_count}', '{$updated_late_count}'
                  , '{$created_date}', '{$modified_date}', '{$tag}',
                  '{$account_change}', '{$block_type}'
          )";

                // Execute the query
                $result = mysql_query($query);
                if (!$result) {
                    $log->error('Error :: inserting data into vtiger_credit_repair table: ' . mysql_error());
                    header("HTTP/1.1 500 Server Error");
                    $response = array('status' => false, 'message' => mysql_error());
                    echo json_encode($response);
                    exit;
                }
            }
        }
    }
    check_exist($account_name_array, 'TransUnion', $record_id);
}

function complete_process_transunion($data)
{
    global $log;
    $automated_data_id = $data['automated_data_id'];

    // Create connection
    $conn = database_conn();

    $update_sql = "UPDATE automated_data 
                    SET auto_import_status_transunion = 'Completed', auto_import_status_text_transunion = 'success'
                    WHERE automated_data_id = $automated_data_id";

    // Execute the update query
    if (mysql_query($update_sql, $conn)) {
        $log->error("Status updated to 'Completed' for automated_data_id $automated_data_id");
    }

    $sql = "SELECT ad.client_id  FROM automated_data as ad WHERE ad.automated_data_id = $automated_data_id  LIMIT 1;";

    $result = mysql_query($sql, $conn);

    // Check if query executed successfully
    if (!$result) {
        $log->error("Error :: Query failed: " . mysql_error());
        die('Query failed: ' . mysql_error());
    }
    // Fetch the data
    $row = mysql_fetch_assoc($result);

    // Check if data was found
    $record_id = '';
    if ($row) {
        $record_id = $row['client_id'];
    }

    $log->error('this is update contact id success ' . $record_id);
    $record_id = '';
    if ($row) {
        $record_id = $row['client_id'];
    }

    $log->error('this is update contact id success ' . $record_id);
    $sql_update = "UPDATE `vtiger_contactscf` SET `cf_1203` = '0', `cf_1207` = '' WHERE `contactid` = $record_id";
    $log->error($sql_update);
    $res_update = mysql_query($sql_update, $conn);
    if (!$res_update) {
        $log->error("Error :: Query failed: " . mysql_error());
        die('Query failed: ' . mysql_error());
    }
}


function error_process_transunion($data)
{
    global $log;
    $automated_data_id = $data['automated_data_id'];
    $error_message = isset($data['error_message']) ? $data['error_message'] : 'Error';
    // Create connection
    $conn = database_conn();

    $update_sql = "UPDATE automated_data 
                    SET auto_import_status_transunion = 'Error', auto_import_status_text_transunion = '$error_message'
                    WHERE automated_data_id = $automated_data_id and auto_import_status_transunion != 'Error'";

    // Execute the update query
    if (mysql_query($update_sql, $conn)) {
        $log->error("Status updated to 'Error' for automated_data_id $automated_data_id");
    }

    $error_message_array = ['User name and password are empty', 'Invalid username and password', 'Email value does not contain the expected domain', 'Email does not match with sended OTP on email address.'];
    if (in_array($error_message, $error_message_array)) {
        $log->error('update user data');
        $sql = "SELECT ad.client_id  FROM automated_data as ad WHERE ad.automated_data_id = $automated_data_id  LIMIT 1;";

        $result = mysql_query($sql, $conn);

        // Check if query executed successfully
        if (!$result) {
            $log->error("Error :: Query failed: " . mysql_error());
            die('Query failed: ' . mysql_error());
        }
        // Fetch the data
        $row = mysql_fetch_assoc($result);

        // Check if data was found
        $record_id = '';
        if ($row) {
            $record_id = $row['client_id'];
        }

        $log->error('this is update contact id ' . $record_id);

        $sql_update = "UPDATE `vtiger_contactscf` SET `cf_1203` = '1', `cf_1207` = '$error_message' WHERE `contactid` = $record_id";
        $log->error($sql_update);
        $res_update = mysql_query($sql_update, $conn);
        if (!$res_update) {
            $log->error("Error :: Query failed: " . mysql_error());
            die('Query failed: ' . mysql_error());
        }
    }
}



function error_credit_repair($data)
{
    global $log;
    $credit_repair_id = $data['credit_repair_id'];
    $error_message = isset($data['error_message']) ? $data['error_message'] : 'Error';
    $client_id = $data['client_id'];
    // Create connection
    $conn = database_conn();

    $update_sql = "UPDATE transunion_dispute_account_status 
                    SET status_text = 'Error', comment = '$error_message'
                    WHERE credit_repair_id = $credit_repair_id and status_text = 'In-Progress' AND client_id = $client_id";

    // Execute the update query
    if (mysql_query($update_sql, $conn)) {
        $log->error("Status updated to 'Error' for credit_repair_id $credit_repair_id");
    }
}


function success_credit_repair($data)
{
    global $log;
    $credit_repair_id = $data['credit_repair_id'];
    $message = isset($data['message']) ? $data['message'] : 'Success';
    $client_id = $data['client_id'];
    // Create connection
    $conn = database_conn();

    $update_sql = "UPDATE transunion_dispute_account_status 
                    SET status_text = 'Success', comment = '$message'
                    WHERE credit_repair_id = $credit_repair_id and status_text = 'In-progress' AND client_id = $client_id";

    // Execute the update query
    if (mysql_query($update_sql, $conn)) {
        $log->error("Status updated to 'Error' for credit_repair_id $credit_repair_id");
    }
}

function get_creditpair_accounts($data)
{
    global $log;
    $conn = database_conn();
    $record = $data['client_id'];
    $log->error('get_creditpair_accounts function is being executed --' . json_encode($data));
    $sql = "SELECT * FROM `vtiger_credit_repair` WHERE creditor LIKE 'TransUnion' AND  `client_id` = $record and block_type NOT IN ('closed','removed') ORDER BY `vtiger_credit_repair`.`credit_repair_id` DESC LIMIT 1 ";
    $check_script_data = isset($data['check_script_data']) ? $data['check_script_data'] : false;
    $submitted_data = [];
    $result = mysql_query($sql, $conn);
    $j = 0;


    $asql = "SELECT * FROM `automated_data` where client_id = $record ORDER BY `automated_data_id` DESC LIMIT 1";
    $aresult = mysql_query($asql, $conn);
    $created_date = date('Y-m-d H:i:s');
    if (mysql_num_rows($aresult) > 0) {
        while ($arow = mysql_fetch_array($aresult)) {
            $created_date = $arow["date_created"];
        }
    }


    if (mysql_num_rows($result) > 0) {
        // row_inner data of each row
        while ($row = mysql_fetch_array($result)) {
            $creditor_name = $row["creditor_name"];
            $credit_repair_id = $row["credit_repair_id"];
            $open_date = date('m/d/Y', strtotime($row["open_date"]));
            if (!$check_script_data) {
                $log->error("Calling API through admin panel ");
                $sql_inner = "SELECT * FROM `dispute_account_status` WHERE  `credit_repair_id` = $credit_repair_id AND `client_id` = $record ORDER BY `dispute_account_status`.`dispute_account_id` DESC LIMIT 1 ";
                $result_inner = mysql_query($sql_inner, $conn);
                $log->error("sql_inner: " . $sql_inner);
                if (!$result_inner) {
                    $log->error('Error :: fetching data into dispute_account_status table: ' . mysql_error());
                    header("HTTP/1.1 500 Server Error");
                    $response = array('status' => false, 'message' => mysql_error());
                    echo json_encode($response);
                    exit;
                }
                if (mysql_num_rows($result_inner) > 0) {
                    while ($row_inner = mysql_fetch_array($result_inner)) {
                        $log->error("row_inner: " . json_encode($row_inner));
                        $accuracy2 = '';
                        // $created_date = $row["created_date"];


                        $sql_automate = 'SELECT * FROM `automate_default_values` LIMIT 1';
                        $retval = mysql_query($sql_automate, $conn);
                        if (!$retval) {
                            $log->error('Error :: fetching data into automate_default_values table: ' . mysql_error());
                            header("HTTP/1.1 500 Server Error");
                            $response = array('status' => false, 'message' => mysql_error());
                            echo json_encode($response);
                            exit;
                        }
                        $result = mysql_fetch_assoc($retval);

                        $credit_repair_id = $row_inner['credit_repair_id'];
                        $ownership = ($result['dispute_ownership_transunion']) ? $result['dispute_ownership_transunion'] : '';
                        $accuracy1 = isset($result['dispute_accuracy_transunion']) ? $result['dispute_accuracy_transunion'] : '';
                        $comment_message = isset($result['dispute_comment_transunion']) ? $result['dispute_comment_transunion'] : '';

                        $insert_query = "INSERT INTO transunion_dispute_account_status(client_id,credit_repair_id,ownership,accuracy1,accuracy2,comment,reference_number,status_text,submitted_on,estimated_completion_date,created_date) VALUES
                        ('$record','$credit_repair_id','$ownership','$accuracy1','$accuracy2','$comment_message','','In-Progress',NULL,NULL,'$created_date')";
                        $retval = mysql_query($insert_query, $conn);
                        if (!$retval) {
                            $log->error('Error :: inserting data into transunion_dispute_account_status table: ' . mysql_error());
                            header("HTTP/1.1 500 Server Error");
                            $response = array('status' => false, 'message' => mysql_error());
                            echo json_encode($response);
                            exit;
                        }
                        add_autobot_notification($record, 'TransUnion', 'dispute');
                        $submitted_data[$j]['creditor_name'] = $creditor_name;
                        $submitted_data[$j]['open_date'] = $open_date;
                        $submitted_data[$j]['credit_repair_id'] = $credit_repair_id;
                        $submitted_data[$j]['accuracy'] = $accuracy1;
                        $submitted_data[$j]['comment'] = $comment_message;
                        $submitted_data[$j]['ownership'] = $ownership;
                    }
                }
            } else {
                $log->error("Calling API through pthon script ");

                $sql_automate = 'SELECT * FROM `automate_default_values` LIMIT 1';
                $retval = mysql_query($sql_automate, $conn);
                if (!$retval) {
                    $log->error('Error :: fetching data into automate_default_values table: ' . mysql_error());
                    header("HTTP/1.1 500 Server Error");
                    $response = array('status' => false, 'message' => mysql_error());
                    echo json_encode($response);
                    exit;
                }
                $result = mysql_fetch_assoc($retval);

                // $credit_repair_id = $credit_repair_id;
                $ownership = ($result['dispute_ownership_transunion']) ? $result['dispute_ownership_transunion'] : '';
                $accuracy1 = isset($result['dispute_accuracy_transunion']) ? $result['dispute_accuracy_transunion'] : '';
                $comment_message = isset($result['dispute_comment_transunion']) ? $result['dispute_comment_transunion'] : '';
                $accuracy2 = '';
                // $created_date = $row["created_date"];


                $insert_query = "INSERT INTO transunion_dispute_account_status(client_id,credit_repair_id,ownership,accuracy1,accuracy2,comment,reference_number,status_text,submitted_on,estimated_completion_date,created_date) VALUES
                ('$record','$credit_repair_id','$ownership','$accuracy1','$accuracy2','$comment_message','','In-Progress',NULL,NULL,'$created_date')";
                $retval = mysql_query($insert_query, $conn);
                if (!$retval) {
                    $log->error('Error :: inserting data into transunion_dispute_account_status table: ' . mysql_error());
                    header("HTTP/1.1 500 Server Error");
                    $response = array('status' => false, 'message' => mysql_error());
                    echo json_encode($response);
                    exit;
                }
                add_autobot_notification($record, 'TransUnion', 'dispute');
                $submitted_data[$j]['creditor_name'] = $creditor_name;
                $submitted_data[$j]['open_date'] = $open_date;
                $submitted_data[$j]['credit_repair_id'] = $credit_repair_id;
                $submitted_data[$j]['accuracy'] = $accuracy1;
                $submitted_data[$j]['comment'] = $comment_message;
                $submitted_data[$j]['ownership'] = $ownership;
            }
        }
    }

    $data['status'] = true;
    $data['accounts'] = $submitted_data;
    $log->error("Got the data of dispute account by automation" . json_encode($data));
    // Close the connection when done
    mysql_close($conn);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function delete_auto_despute_failed_transunion()
{
    global $log;
    $log->error('delete_auto_despute_failed_transunion function is being executed');
    $today_date = date('Y-m-d');
    $sql = "update `automated_data` set auto_import_status_transunion = 'Pending', auto_import_status_text_transunion = '' where auto_import_status_transunion LIKE 'completed' AND DATE(date_created) = '$today_date' and client_id in (SELECT client_id FROM `transunion_dispute_account_status` where status_text like 'error' and date(created_date) = '$today_date' and comment in ('Dispute url not loaded properly','Dispute checbox url not loaded properly', 'Dispute radiobox url not loaded properly', 'Dispute comment url not loaded properly','Dispute document url not loaded properly', 'Dispute account url not loaded properly', 'Dispute submitted url not loaded properly'))";
    // // Create connection
    $conn = database_conn();
    if (mysql_query($sql, $conn)) {
        $log->error("$sql");
    }

    $sql1 = "UPDATE `automated_data` SET auto_import_status_transunion = 'Pending', auto_import_status_text_transunion = '' WHERE DATE(date_created) = '$today_date' AND ( auto_import_status_transunion LIKE 'Error') AND auto_import_status_text_transunion IN('Credit score url not loaded properly', 'Login url not loaded properly', 'OTP screen not loaded properly', 'Email does not match with sended OTP on email address.','Dashboard url not loaded properly', 'Dispute account url not loaded properly')";

    if (mysql_query($sql1, $conn)) {
        $log->error("$sql1");
    }

    $update_sql = "delete from transunion_dispute_account_status where status_text like 'error' and date(created_date) = '$today_date' and comment in ('Dispute url not loaded properly','Dispute checbox url not loaded properly', 'Dispute radiobox url not loaded properly', 'Dispute comment url not loaded properly','Dispute document url not loaded properly', 'Dispute account url not loaded properly', 'Dispute submitted url not loaded properly')";

    // Execute the update query
    if (mysql_query($update_sql, $conn)) {
        $log->error("$update_sql");
    }
    header('Content-Type: application/json');
    echo json_encode(['status' => true, 'message' => 'Data deleted successfully']);
    $log->error('delete_auto_despute_failed_transunion function is completed');

    exit;
}

function get_experian_dispute_data()
{
    global $log;
    $conn = database_conn();
    $client_id = "";
    $personal_array = array();
    $skip = isset($_GET['skip']) ? $_GET['skip'] : 0;
    $sql = "SELECT * FROM `experian_dispute_error` WHERE DATE(created_datetime) >= CURDATE() - INTERVAL 1000 DAY AND (status LIKE 'In-progress')  ORDER BY `experian_dispute_error_id` DESC LIMIT 1 OFFSET $skip;";
    $result = mysql_query($sql, $conn);
    if (mysql_num_rows($result) > 0) {
        while ($row = mysql_fetch_array($result)) {
            $client_id = $row["client_id"];
            $filepath = basename($row['filename']);
            $experian_dispute_error_id = $row["experian_dispute_error_id"];
        }
    } else {
        $sql = "update `experian_dispute_error` set status = 'In-progress' where DATE(created_datetime) >= CURDATE() - INTERVAL 1 DAY AND status LIKE 'failed';";
        // $sql = "SELECT * FROM `experian_dispute_error` WHERE DATE(created_datetime) >= CURDATE() - INTERVAL 1 DAY AND (status LIKE 'failed')  ORDER BY `experian_dispute_error_id` DESC LIMIT 1 OFFSET $skip;";
        $result = mysql_query($sql, $conn);
        // if (mysql_num_rows($result) > 0) {
        //     while ($row = mysql_fetch_array($result)) {
        //         $client_id = $row["client_id"];
        //         $filepath = basename($row['filename']);
        //         $experian_dispute_error_id = $row["experian_dispute_error_id"];
        //     }
        // }
        die;
    }

    $personal_array['client_id'] = $client_id;
    $sql = "SELECT vtiger_contactscf.cf_929,vtiger_contactscf.cf_767,vtiger_contactscf.cf_769,vtiger_contactscf.cf_771,vtiger_contactscf.cf_773,vtiger_contactscf.cf_775,vtiger_contactscf.cf_777,vtiger_contactscf.cf_784,vtiger_contactsubdetails.birthday,vtiger_contactdetails.firstname,vtiger_contactdetails.lastname,vtiger_contactdetails.email, vtiger_contactdetails.phone,vtiger_contactdetails.mobile,vtiger_contactdetails.mobile FROM vtiger_contactsubdetails INNER JOIN vtiger_contactdetails ON vtiger_contactsubdetails.contactsubscriptionid=vtiger_contactdetails.contactid INNER JOIN vtiger_contactscf ON vtiger_contactscf.contactid=vtiger_contactdetails.contactid WHERE vtiger_contactdetails.contactid=$client_id;";

    $result = mysql_query($sql, $conn);
    $postalcode = $firstname = $lastname = $phone = $mobile = $birthday = '';
    if (mysql_num_rows($result) > 0) {
        $skip++;
        while ($row = mysql_fetch_array($result)) {
            $firstname = $row["firstname"];
            $lastname = $row["lastname"];
            $phone = $row["phone"];
            $mobile = $row["mobile"];
            $birthday = $row["birthday"];
            //if($row["birthday"] == '' || $row["birthday"] == '0000-00-00') { $birthday = ''; } else { $birthday = $row["birthday"]; }
            $email = $row["email"];
            $social_security_number = (string) $row["cf_784"];
            $address = $row["cf_767"];
            $postalcode = str_replace('`', '', $row["cf_771"]);
            $city = $row["cf_773"];
            $country = $row["cf_775"];
            $state = $row["cf_777"];

            $personal_array['firstname'] = str_replace('-', '', $firstname);
            $personal_array['lastname'] = str_replace('-', '', $lastname);
            $personal_array['phone'] = str_replace('-', '', $phone);
            $personal_array['mobile'] = str_replace('-', '', $mobile);
            $personal_array['birthday'] = $birthday;
            $personal_array['email'] = str_replace('-', '', $email);
            $personal_array['social_security_number'] = str_replace('-', '', $social_security_number);
            $personal_array['address'] = str_replace('-', '', $address);
            $personal_array['address'] = str_replace(["\\", "\/"], '/', $personal_array['address']);
            // echo $personal_array['address'];exit;
            $personal_array['postalcode'] = str_replace('-', '', $postalcode);
            $personal_array['city'] = str_replace('-', '', $city);
            $personal_array['city'] = str_replace([" ", "\/"], '', $personal_array['city']);
            $personal_array['country'] = str_replace('-', '', $country);
            $personal_array['state'] = str_replace('-', '', $state);
            $personal_array['filename'] = $filepath;
            $personal_array['filepath'] = $filepath;
            $personal_array['experian_dispute_error_id'] = $experian_dispute_error_id;
            $personal_array['skip'] = $skip;
            if (empty($personal_array['city'])) {
                if (stripos($personal_array['state'], ',') !== false) {
                    $address_parts = explode(',', $personal_array['state']);
                    $personal_array['city'] = trim($address_parts[0]);
                    $personal_array['state'] = trim($address_parts[1]);
                } else if (stripos($personal_array['state'], ' ') !== false) {
                    $address_parts = explode(' ', $personal_array['state']);
                    $personal_array['city'] = trim($address_parts[0]);
                    $personal_array['state'] = trim($address_parts[1]);
                }
            }
        }
    }
    $log->error("Got the data of experian dispute user" . json_encode($personal_array));
    header('Content-Type: application/json');
    echo json_encode($personal_array);
    exit;

}


function experian_dispute_error_api_error()
{

    global $log;
    $json_data = file_get_contents('php://input');
    $data = json_decode($json_data, true);

    $log->error("Function called experian_dispute_error_api_error");
    $log->error($data);
    $experian_dispute_error_id = $data['experian_dispute_error_id'];
    $message = isset($data['error_message']) ? $data['error_message'] : '';
    // Create connection
    $conn = database_conn();

    $update_sql = "UPDATE experian_dispute_error 
                    SET status_text = '$message', status = 'Failed'
                    WHERE experian_dispute_error_id = $experian_dispute_error_id";

    // Execute the update query
    if (mysql_query($update_sql, $conn)) {
        $log->error("Status updated to 'Error' for credit_repair_id $experian_dispute_error_id");
    }
}

function experian_dispute_error_api_success()
{
    global $log;
    $json_data = file_get_contents('php://input');
    $data = json_decode($json_data, true);

    $log->error("Function called experian_dispute_error_api_success");
    $log->error($data);
    $experian_dispute_error_id = $data['experian_dispute_error_id'];
    $message = isset($data['error_message']) ? $data['error_message'] : '';
    // Create connection
    $conn = database_conn();

    $update_sql = "UPDATE experian_dispute_error 
                    SET status_text = '$message', status = 'Success'
                    WHERE experian_dispute_error_id = $experian_dispute_error_id";

    // Execute the update query
    if (mysql_query($update_sql, $conn)) {
        $log->error("Status updated to 'Error' for credit_repair_id $experian_dispute_error_id");
    }
}

function update_next_charge_date()
{
    global $log;
    $json_data = file_get_contents('php://input');
    $data = json_decode($json_data, true);

    $log->error("Function called update_next_charge_date");
    $log->error($data);
    $client_id = $data['client_id'];
    $status = $data['status'];
    // Create connection
    $conn = database_conn();

    $update_sql = "UPDATE vtiger_contactdetails 
                    SET next_charge_date_status = '$status'
                    WHERE contactid = $client_id";

    if (mysql_query($update_sql, $conn)) {
        $log->error("Status updated for next charge date for client $client_id");
    }
    header('Content-Type: application/json');
    echo json_encode(['status' => true, 'message' => 'Next charge date updated successfully']);
    exit;

}


function update_inprogress_to_pending_equifax()
{
    global $log;
    $log->error("Function called update_inprogress_to_pending_equifax");
    $conn = database_conn();

    $update_sql = "update `automated_data` set auto_import_status_equifax = 'Pending', auto_import_status_text_equifax = '' where auto_import_status_equifax like 'Inprogress' and date(date_created) = CURDATE() - INTERVAL 2 DAY;";
    if (mysql_query($update_sql, $conn)) {
        $log->error("Status updated for next charge date for client");
    }
    header('Content-Type: application/json');
    echo json_encode(['status' => true, 'message' => 'Status updated from Inprogress to Pending for Equifax']);
    exit;

}

function dispute_page_address($data, $creditor = 'Equifax')
{
    global $log;
    $log->error("Function called dispute_page_address");
    $log->error($data);
    $record_id = $data['record_id'];
    $created_date = date('Y-m-d H:i:s');
    $conn = database_conn();

    // Create connection
    foreach ($data['address'] as $val) {

        $field_name = 'address';
        $value = $val['full_address'];

        $sql = "SELECT * FROM `vtiger_personal_info` where field_value ='$value' and creditor= '$creditor' and contact_id ='$record_id' and is_deleted = 'no'";
        $result = mysql_query($sql, $conn);

        if (mysql_num_rows($result) > 0) {
            echo $sql;
            echo "<br>";
        } else {
            $sql_insert = "INSERT INTO vtiger_personal_info (contact_id, field_name, field_value, is_deleted, creditor, created_date,updated_date) VALUES ('$record_id', '$field_name', '$value', 'no','$creditor','$created_date','$created_date');";
            $log->error($sql_insert);

            $result_insert = mysql_query($sql_insert, $conn);
            if (!$result_insert) {
                $log->error('Error :: inserting data into personal info table: ' . mysql_error());
                header("HTTP/1.1 500 Server Error");
                $response = array('status' => false, 'message' => mysql_error());
                echo json_encode($response);
                exit;
            }
        }
    }

}


function send_mail_for_transunion_username_password_empty()
{
    global $log;
    $conn = database_conn();
    $log->error('send_mail_for_transunion_username_password_empty function is being executed');

    $sql = "SELECT vtiger_contactdetails .mobile,vtiger_contactdetails.email,vtiger_contactdetails.firstname,vtiger_contactdetails.lastname,ad.date_created,ad.automated_data_id,vcc.transunion_username, vcc.transunion_password, vcc.contact_id  FROM automated_data as ad join vtiger_contacts_credentials as vcc on ad.client_id = vcc.contact_id
            INNER JOIN vtiger_contactdetails ON vtiger_contactdetails.contactid = ad.client_id
            WHERE ad.auto_import_status_transunion LIKE 'Error' AND (date(ad.date_created) = CURDATE() - INTERVAL 2 DAY) AND
            auto_import_status_text_transunion LIKE 'User name and password are empty'
            ORDER BY ad.automated_data_id ASC;";

    $result = mysql_query($sql, $conn);
    if (!$result) {
        $log->error("Error :: Query failed: " . mysql_error());
        die('Query failed: ' . mysql_error());
    }
    $texts = '';
    while ($row = mysql_fetch_assoc($result)) {
        if ($row) {
            $texts .= '<tr>
                        <td>' . $row['contact_id'] . '</td>
                        <td>' . $row['firstname'] . ' ' . $row['lastname'] . '</td>
                        <td>' . $row['email'] . '</td>
                        <td>' . $row['mobile'] . '</td>
                        <td><a href="https://portal.canadacreditrepairs.ca/index.php?module=Contacts&view=Detail&record=' . $row['contact_id'] . '">Click me</a></td>
                    </tr>';
        }
    }
    mysql_close($conn);

    if (!empty($texts)) {
        $mailText = '
            <p>The clients have not provided their username or password.</p>

                <table border="1"  width="50%" cellpadding="10" cellspacing="0" style="border-collapse:collapse;">
                    <thead>
                        <tr>
                            <th>Client ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Profile URL</th>
                        </tr>
                    </thead>
                    <tbody>
                        REPLACE_TEXT
                    </tbody>
                </table>
            <br><br>
            <p>Credit Freedom with Melissa</p>
            <p>Toll Free 1-866-391-6303</p>
            <p>Office 1-646-693-4470</p>
        ';
        $mailText = str_replace('REPLACE_TEXT', $texts, $mailText);
        $domain = "creditfreedomrestoration.com";
        $api_key = getenv("MAILGUN_API_KEY");
        $url = "https://api.mailgun.net/v3/$domain/messages";

        $from = 'melissa@creditfreedomandrestoration.com';
        $to = 'info@crreditfreedomandrestoration.com';
        $parameters = array(
            'from' => $from,
            'to' => $to,
            'subject' => 'Transunion action required',
            'html' => $mailText
        );

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_USERPWD, "api:$api_key");

        curl_setopt($ch, CURLOPT_POST, true);
        // curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: multipart/form-data'));
        curl_setopt($ch, CURLOPT_POSTFIELDS, $parameters);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $y = curl_exec($ch);
        curl_close($ch);
        // captureLog($record_id, $from, $to, $subject, $message, 'mail', 'see_transunion_username_password_empty');
    }

    header('Content-Type: application/json');
    echo json_encode(['status' => true, 'message' => 'Mail sent successfully']);
    exit;
}


function get_experian_user($automated_data_id)
{
    global $log;
    $conn = database_conn();
    $skip = isset($_GET['skip']) ? $_GET['skip'] : 0;
    $orderBY = isset($_GET['order']) ? $_GET['order'] : 'DESC';
    if ($automated_data_id != '') {
        $concat = "AND  ad.automated_data_id = $automated_data_id";
    } else {
        $concat = "";
    }
    // $log->error('get_experian_user function is being executed');
    query_again:

    $data = [];

    // SQL query to get data where dispute_submit_status_creditkarma = 'Pending' and dow_stauts = 'accepted'
    $sql = "SELECT 
    vtiger_contactsubdetails.birthday AS birth_date,
    vtiger_contactscf.cf_784 AS social_security_number,
    vcc.exp_security_answer,
    vcc.exp_pin,
    ad.automated_data_id,
    vcc.exp_username AS username,
    vcc.exp_password AS password,
    vcc.contact_id,
    DATE(ad.date_created) AS date_created  
FROM 
    automated_data AS ad
JOIN 
    vtiger_contacts_credentials AS vcc ON ad.client_id = vcc.contact_id
LEFT JOIN 
    vtiger_contactscf ON vtiger_contactscf.contactid = ad.client_id
LEFT JOIN 
    vtiger_contactsubdetails ON vtiger_contactsubdetails.contactsubscriptionid = ad.client_id
WHERE 
    ad.auto_import_status_experian LIKE 'Pending'  $concat
    AND DATE(ad.date_created) >= CURDATE() - INTERVAL 60 DAY
ORDER BY 
    ad.automated_data_id $orderBY
LIMIT 1 OFFSET $skip;";

    // $sql = "SELECT vcc.exp_security_answer,vcc.exp_pin,ad.automated_data_id,vcc.exp_username as username, vcc.exp_password as password, vcc.contact_id  FROM automated_data as ad join vtiger_contacts_credentials as vcc on ad.client_id = vcc.contact_id
    //         WHERE ad.auto_import_status_experian LIKE 'Pending' AND date(ad.date_created) >= CURDATE() - INTERVAL 1 DAY 
    //         LIMIT 1 OFFSET $skip;";
    //AND  ad.automated_data_id = 270576
    // Execute the query
    $result = mysql_query($sql, $conn);

    // Check if query executed successfully
    if (!$result) {
        $log->error("Error :: Query failed: " . mysql_error());
        die('Query failed: ' . mysql_error());
    }

    // Fetch the data
    $row = mysql_fetch_assoc($result);

    // Check if data was found
    if ($row) {
        $skip++;

        // Get the automated_data_id for updating
        $automated_data_id = $row['automated_data_id'];

        $data['client_id'] = $row['contact_id'];
        $data['username'] = decryptData($row['username']);
        $data['password'] = decryptData($row['password']);
        $data['skip'] = $skip;
        $data['status'] = true;
        $data['automated_data_id'] = $row['automated_data_id'];
        $data['security_answer'] = decryptData($row['exp_security_answer']);
        $data['security_pin'] = decryptData($row['exp_pin']);
        $data['date_created'] = $row['date_created'];
        $data['social_security_number'] = $row['social_security_number'];
        $data['birth_date'] = date('m/d/Y', strtotime($row['birth_date']));
    } else {
        $data['status'] = false;
        $data['skip'] = $skip;
    }

    if (isset($data['username'])) {

        // Update the status of the record to 'Inprogress'
        // $update_sql = "UPDATE automated_data 
        //             SET auto_import_status_experian = 'Inprogress'
        //             WHERE automated_data_id = $automated_data_id";

        // Execute the update query
        // if (mysql_query($update_sql, $conn)) {
        //     $log->error("Experian Status updated to 'Inprogress' for automated_data_id $automated_data_id");
        //     //echo "Status updated to 'Inprogress' for automated_data_id $automated_data_id";
        // }
    } else if (isset($data['username'])) { // Username is exists but no same domain of email
        goto query_again;
    }

    // $log->error("Got the data of user" . json_encode($data));
    // Close the connection when done
    mysql_close($conn);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function unused_api()
{
    global $log;
    $conn = database_conn();
    $client_id = isset($_GET['client_id']) ? $_GET['client_id'] : 0;

    // $log->error('get_experian_user function is being executed');

    $data = [];

    // SQL query to get data where dispute_submit_status_creditkarma = 'Pending' and dow_stauts = 'accepted'
    $sql = "SELECT vcc.exp_security_answer,vcc.exp_pin,ad.automated_data_id,vcc.exp_username as username, vcc.exp_password as password, vcc.contact_id,Date(ad.date_created) as date_created  FROM automated_data as ad join vtiger_contacts_credentials as vcc on ad.client_id = vcc.contact_id
            WHERE ad.client_id = $client_id
            ORDER BY ad.automated_data_id DESC LIMIT 1;";

    // $sql = "SELECT vcc.exp_security_answer,vcc.exp_pin,ad.automated_data_id,vcc.exp_username as username, vcc.exp_password as password, vcc.contact_id  FROM automated_data as ad join vtiger_contacts_credentials as vcc on ad.client_id = vcc.contact_id
    //         WHERE ad.auto_import_status_experian LIKE 'Pending' AND date(ad.date_created) >= CURDATE() - INTERVAL 1 DAY 
    //         LIMIT 1 OFFSET $skip;";
    //AND  ad.automated_data_id = 270576
    // Execute the query
    $result = mysql_query($sql, $conn);

    // Check if query executed successfully
    if (!$result) {
        $log->error("Error :: Query failed: " . mysql_error());
        die('Query failed: ' . mysql_error());
    }

    // Fetch the data
    $row = mysql_fetch_assoc($result);

    // Check if data was found
    if ($row) {

        // Get the automated_data_id for updating
        $automated_data_id = $row['automated_data_id'];

        $data['client_id'] = $row['contact_id'];
        $data['username'] = decryptData($row['username']);
        $data['password'] = decryptData($row['password']);
        $data['status'] = true;
        $data['automated_data_id'] = $row['automated_data_id'];
        $data['security_answer'] = decryptData($row['exp_security_answer']);
        $data['security_pin'] = decryptData($row['exp_pin']);
        $data['date_created'] = $row['date_created'];
    } else {
        $data['status'] = false;

    }


    $log->error("Got the data of user" . json_encode($data));
    // Close the connection when done
    mysql_close($conn);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function store_experian_data()
{
    global $log;
    $log->error('store_experian_data function is being executed');
    if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_SERVER['CONTENT_TYPE']) && strpos($_SERVER['CONTENT_TYPE'], 'application/json') !== false) {
        $json_data = file_get_contents('php://input');
        $data = json_decode($json_data, true);
        $type = isset($data['type']) ? $data['type'] : 'collection';

        $log->error('store_experian_data data');
        $log->error($data);
        $log->error(json_encode($data));


        switch ($type) {
            case 'inquiry':
                $log->error('inquiry function is being executed');
                add_inquiry($data, 'Experian');
                $log->error('inquiry function is completed');
                break;
            case 'credit_score':
                $log->error('credit_score function is being executed');
                credit_score($data, 'Experian');
                $log->error('credit_score function is completed');
                break;
            case 'collection':
                $log->error('collection function is being executed');
                add_collection($data, 'Experian');
                $log->error('collection function is completed');
                break;
            case 'accounts':
                $log->error('experian accounts function is being executed');
                add_accounts_experian($data, 'Experian');
                $log->error('experian accounts function is completed');
                break;
            case 'complete_process':
                $log->error('complete_process_experian function is being executed');
                complete_process_experian($data);
                $log->error('complete_process_experian function is completed');
                break;
            case 'inprogress_process':
                $log->error('inprgress_process_experian function is being executed');
                inprgress_process_experian($data);
                $log->error('inprgress_process_experian function is completed');
                break;
            case 'error_experian_user':
                $log->error('error_experian_user function is being executed');
                error_experian_user($data);
                $log->error('error_experian_user function is completed');
                break;
            case 'personal_information':
                $log->error('personal_information function is being executed');
                insert_personal_data($data, 'Experian');
                $log->error('personal_information function is completed');
                break;
            case 'get_creditpair_accounts_experian':
                $log->error('get_creditpair_accounts_experian function is being executed');
                get_creditpair_accounts_experian($data);
                $log->error('get_creditpair_accounts_experian function is completed');
                break;
            case 'success_dispute':
                $log->error('success_dispute function is being executed');
                experian_success_dispute($data);
                $log->error('success_dispute function is completed');
                break;
            case 'whats_change':
                $log->error('whats_change_experian function is being executed');
                whats_change_experian($data);
                $log->error('whats_change_experian function is completed');
                break;
            case 'failed_dispute':
                $log->error('failed_dispute function is being executed');
                experian_failed_dispute($data);
                $log->error('failed_dispute function is completed');
                break;

            default:
                $log->error('Error :: Invalid type in store');
                header('Content-Type: application/json');
                header("HTTP/1.1 400 Bad Request");
                $response = array('status' => false, 'message' => 'Invalid type');
                echo json_encode($response);
                exit;
        }

        // Return a JSON response
        header('Content-Type: application/json');
        $response = array('status' => true, 'message' => 'Data inserted successfully');
        echo json_encode($response);
        exit;
    } else {
        $log->error('Error :: Invalid request in store_equifax_data ');
        header('Content-Type: application/json');
        header("HTTP/1.1 400 Bad Request");
        $response = array('status' => false, 'message' => 'Invalid request');
        echo json_encode($response);
    }
}


function inprgress_process_experian($data)
{
    global $log;
    $log->error('inprgress_process_experian function is being executed');
    $automated_data_id = $data['automated_data_id'];
    // Create connection
    $conn = database_conn();

    $update_sql = "UPDATE automated_data 
                    SET auto_import_status_experian = 'Inprogress'
                    WHERE automated_data_id = $automated_data_id and auto_import_status_experian LIKE 'Pending'";
    $createddate = date('Y-m-d H:i:s');
    $message_date = date('m-d-Y h:i a');
    $notification_msg = "Auto Bot has picked this profile for Experian import at $message_date";
    if (!empty($data['client_id'])) {
        $client_id = $data['client_id'];
        $sql_noti = "INSERT INTO vtiger_credit_notification (record_id, notification_msg,notification_type, createddate) VALUES ($client_id, '$notification_msg','autoimport', '$createddate')";
        $retval_noti = mysql_query($sql_noti, $conn);
    }
    $log->error("Status updated to 'Inprogress' for automated_data_id $update_sql");
    // Execute the update query
    if (mysql_query($update_sql, $conn)) {
        $log->error("Status updated to 'Inprogress' for automated_data_id $automated_data_id");
    }
}


function error_experian_user($data)
{
    global $log;
    $log->error('error_experian_user function is being executed');
    $automated_data_id = $data['automated_data_id'];
    $error_message = isset($data['error_message']) ? $data['error_message'] : 'Error';
    // Create connection
    $conn = database_conn();

    $update_sql = "UPDATE automated_data 
                    SET auto_import_status_experian = 'Error', auto_import_status_text_experian = '$error_message'
                    WHERE automated_data_id = $automated_data_id and auto_import_status_experian LIKE 'Pending'";
    $log->error("error_experian_user Status updated to 'Error' for automated_data_id $update_sql");
    // Execute the update query
    if (mysql_query($update_sql, $conn)) {
        $log->error("error_experian_user Status updated to 'Error' for automated_data_id $automated_data_id");
    }
}


function add_accounts_experian($data, $creditor = 'Experian')
{

    global $log;
    // Create connection
    $conn = database_conn();

    $record_id = $data['record_id'];
    $open_accounts = $data['open_accounts'];
    $closed_accounts = isset($data['closed_accounts']) ? $data['closed_accounts'] : array();

    $log->error('add_accounts function is being executed');
    $log->error('Record ID: ' . $record_id);
    $account_name_array = [];


    foreach ($open_accounts as $value) {

        $record_id = mysql_real_escape_string($data['record_id']);
        $creditor_name = mysql_real_escape_string($value['account_name']); // Assuming data is missing, you can replace with real value
        $account_type = mysql_real_escape_string($value['account_type']); // INSTALLMENT

        $account_name_array[] = $creditor_name;

        $account_number = mysql_real_escape_string($value['account_number']); // Account number 
        $account_status = mysql_real_escape_string($value['account_status']); // PAYS_AS_AGREED
        $payment_status = "-"; // You can set this from your JSON if available

        $worst_payment_status = '-';
        $open_date = date('Y-m-d H:i:s', strtotime(mysql_real_escape_string($value['date_opened']))); // Mar 29, 2024
        $times_days_late = "-"; // Can be computed or derived based on some logic

        $remarks = "-"; // Empty or can be extracted from JSON
        $credit_balance = mysql_real_escape_string($value['balance']); // $31,765
        $old_credit_balance = mysql_real_escape_string($value['high_credit']); // Replace if you have this info

        $previous_credit_balance = "-"; // Replace if you have this info
        $creditOrBalanceValue = "-"; // Replace as per requirement
        $new_remark = "-"; // Set based on your logic

        $dispute_status = "-"; // Replace based on requirement
        // Set this based on your logic
        $amount_of_late = "-"; // Based on your logic

        $display_status = "-"; // Replace as needed
        $current_late_count = "-"; // Derived value
        $updated_late_count = "-"; // Derived value

        $created_date = date("Y-m-d H:i:s"); // Current date/time
        $modified_date = date("Y-m-d H:i:s"); // Current date/time
        $tag = "-"; // Replace if you have this info

        $account_change = "-"; // Replace with info if you have it
        $block_type = "start"; // Replace if needed


        // New workout 
        $tag = '';
        $sql_dispute_status = "SELECT * FROM `vtiger_credit_repair` WHERE `client_id` = $record_id AND creditor='$creditor' AND block_type = '{$block_type}'";
        $result_dispute_status = mysql_query($sql_dispute_status, $conn);
        if (mysql_num_rows($result_dispute_status) > 0) {
            $tag = 'not-started';
        } else {
            $tag = 'started';
        }



        $sql_dispute = "SELECT * FROM `vtiger_credit_repair` WHERE `creditor_name` = '$creditor_name' AND `creditor`='$creditor' AND `open_date`='$open_date' AND `client_id` = $record_id AND block_type = '{$block_type}'";


        $log->error("Experian status and payment status : " . strtolower($value['open/closed']) . " --- " . strtolower($value['checked_late_payment']));
        $log->error($value);

        $result_dispute = mysql_query($sql_dispute, $conn);
        if (!$result_dispute) {
            $log->error('Error :: something went wrong while fetching record to check exsting or not, Method : addData() :  ' . mysql_error());
            die('something went wrong while fetching record to check exsting or not, Method : addData() :  ' . mysql_error());
        }

        if (mysql_num_rows($result_dispute) > 0) {
            $d_status = "Updated";
            $sql = "UPDATE vtiger_credit_repair SET creditor_name='{$creditor_name}',credit_balance='{$credit_balance}',account_type='$account_type',account_status='$account_status',"
                . "payment_status='$payment_status',display_status='$d_status',
          open_date='$open_date',modified_date='$modified_date'  WHERE client_id=" . $record_id . " AND creditor_name='$creditor_name' AND creditor='$creditor' AND open_date='$open_date' AND block_type ='{$block_type}'";
            $result = mysql_query($sql);
            if (!$result) {
                header("HTTP/1.1 500 Server Error");
                $response = array('status' => false, 'message' => mysql_error());
                echo json_encode($response);
                exit;
            }
        } else if ((isset($value['past_due']) && $value['past_due'] != "$0" && $value['past_due'] != "-") || (isset($value['past_due_amount']) && $value['past_due_amount'] != "$0" && $value['past_due_amount'] != "-")) {
            // Insert SQL query
            $query = "INSERT INTO vtiger_credit_repair (
        client_id, creditor_name, account_type, 
        account_number, account_status, payment_status, 
        worst_payment_status, open_date, times_days_late, 
        remarks, credit_balance, old_credit_balance, 
        previous_credit_balance, creditOrBalanceValue, new_remark, 
        despute_status, creditor, amount_of_late, 
        display_status, current_late_count, updated_late_count
        , created_date, modified_date, tag, 
        account_change, block_type) 
          VALUES ('{$record_id}', '{$creditor_name}', '{$account_type}',
                  '{$account_number}', '{$account_status}', '{$payment_status}',
                  '{$worst_payment_status}', '{$open_date}', '{$times_days_late}', 
                  '{$remarks}', '{$credit_balance}', '{$old_credit_balance}',
                  '{$previous_credit_balance}', '{$creditOrBalanceValue}', '{$new_remark}', 
                  '{$dispute_status}', '{$creditor}', '{$amount_of_late}',
                  '{$display_status}', '{$current_late_count}', '{$updated_late_count}'
                  , '{$created_date}', '{$modified_date}', '{$tag}',
                  '{$account_change}', '{$block_type}'
          )";

            // Execute the query
            $result = mysql_query($query);
            if (!$result) {
                $log->error('Error :: inserting data into vtiger_credit_repair table: ' . mysql_error());
                header("HTTP/1.1 500 Server Error");
                $response = array('status' => false, 'message' => mysql_error());
                echo json_encode($response);
                exit;
            }
        }
    }


    foreach ($closed_accounts as $value) {
        $value = $value;

        $record_id = mysql_real_escape_string($data['record_id']);
        $creditor_name = mysql_real_escape_string($value['account_name']);
        $account_type = mysql_real_escape_string($value['account_type']);
        $account_name_array[] = $creditor_name;

        $account_number = mysql_real_escape_string($value['account_number']);
        $account_status = mysql_real_escape_string($value['account_status']);
        $payment_status = "-";

        $worst_payment_status = '-';  //Leave
        $open_date = date('Y-m-d H:i:s', strtotime(mysql_real_escape_string($value['date_opened'])));
        $times_days_late = "-"; //Leave

        $remarks = "--";  //Leave
        $credit_balance = mysql_real_escape_string($value['balance']);
        $old_credit_balance = "";  //Leave

        $previous_credit_balance = "-";  //Leave
        $creditOrBalanceValue = "-"; //Leave
        $new_remark = "-"; //Leave

        $dispute_status = "-";
        $amount_of_late = "-";

        $display_status = "New";
        $current_late_count = "-";
        $updated_late_count = "-";

        $created_date = date("Y-m-d H:i:s");
        $modified_date = date("Y-m-d H:i:s");
        $tag = "-";

        $account_change = "-";
        $block_type = "closed";

        $tag = '';
        $sql_dispute_status = "SELECT * FROM `vtiger_credit_repair` WHERE `client_id` = $record_id AND creditor='$creditor' and block_type = '{$block_type}' ";
        $result_dispute_status = mysql_query($sql_dispute_status, $conn);
        if (mysql_num_rows($result_dispute_status) > 0) {
            $tag = 'not-started';
        } else {
            $tag = 'started';
        }

        $sql_dispute = "SELECT * FROM `vtiger_credit_repair` WHERE `creditor_name` = '$creditor_name' AND `creditor`='$creditor' AND `open_date`='$open_date' AND `client_id` = $record_id AND block_type = '{$block_type}'";


        $result_dispute = mysql_query($sql_dispute, $conn);
        if (!$result_dispute) {
            $log->error('Error :: something went wrong while fetching record to check exsting or not, Method : addData() :  ' . mysql_error());
            die('something went wrong while fetching record to check exsting or not, Method : addData() :  ' . mysql_error());
        }

        if (mysql_num_rows($result_dispute) > 0) {
            $d_status = "Updated";
            $sql = "UPDATE vtiger_credit_repair SET creditor_name='{$creditor_name}',credit_balance='{$credit_balance}',account_type='$account_type',account_status='$account_status',"
                . "payment_status='$payment_status',display_status='$d_status',
          open_date='$open_date',modified_date='$modified_date'  WHERE client_id=" . $record_id . " AND creditor_name='$creditor_name' AND creditor='$creditor' AND open_date='$open_date' AND block_type = '{$block_type}'";
            $result = mysql_query($sql);
            if (!$result) {
                header("HTTP/1.1 500 Server Error");
                $response = array('status' => false, 'message' => mysql_error());
                echo json_encode($response);
                exit;
            }
        } else if ((isset($value['past_due']) && $value['past_due'] != "$0" && $value['past_due'] != "-") || (isset($value['past_due_amount']) && $value['past_due_amount'] != "$0" && $value['past_due_amount'] != "-")) {
            $query = "INSERT INTO vtiger_credit_repair (
      client_id, creditor_name, account_type, 
      account_number, account_status, payment_status, 
      worst_payment_status, open_date, times_days_late, 
      remarks, credit_balance, old_credit_balance, 
      previous_credit_balance, creditOrBalanceValue, new_remark, 
      despute_status, creditor, amount_of_late, 
      display_status, current_late_count, updated_late_count
      , created_date, modified_date, tag, 
      account_change, block_type) 
        VALUES ('{$record_id}', '{$creditor_name}', '{$account_type}',
                '{$account_number}', '{$account_status}', '{$payment_status}',
                '{$worst_payment_status}', '{$open_date}', '{$times_days_late}', 
                '{$remarks}', '{$credit_balance}', '{$old_credit_balance}',
                '{$previous_credit_balance}', '{$creditOrBalanceValue}', '{$new_remark}', 
                '{$dispute_status}', '{$creditor}', '{$amount_of_late}',
                '{$display_status}', '{$current_late_count}', '{$updated_late_count}'
                , '{$created_date}', '{$modified_date}', '{$tag}',
                '{$account_change}', '{$block_type}'
        )";

            // Execute the query
            $result = mysql_query($query);
            if (!$result) {
                $log->error('Error :: inserting data into vtiger_credit_repair table: ' . mysql_error());
                header("HTTP/1.1 500 Server Error");
                $response = array('status' => false, 'message' => mysql_error());
                echo json_encode($response);
                exit;
            }
        }
    }
    check_exist($account_name_array, 'Experian', $record_id);

}


function complete_process_experian($data)
{
    global $log;
    $automated_data_id = $data['automated_data_id'];

    // Create connection
    $conn = database_conn();

    $update_sql = "UPDATE automated_data 
                    SET auto_import_status_experian = 'Completed', auto_import_status_text_experian = 'success'
                    WHERE automated_data_id = $automated_data_id";

    // Execute the update query
    if (mysql_query($update_sql, $conn)) {
        $log->error("Status updated to 'Completed' for automated_data_id $automated_data_id");
    }

    // $sql = "SELECT ad.client_id  FROM automated_data as ad WHERE ad.automated_data_id = $automated_data_id  LIMIT 1;";

    // $result = mysql_query($sql, $conn);

    // // Check if query executed successfully
    // if (!$result) {
    //     $log->error("Error :: Query failed: " . mysql_error());
    //     die('Query failed: ' . mysql_error());
    // }
    // // Fetch the data
    // $row = mysql_fetch_assoc($result);

    // // Check if data was found
    // $record_id = '';
    // if ($row) {
    //     $record_id = $row['client_id'];
    // }

    // $log->error('this is update contact id success ' . $record_id);
    // $record_id = '';
    // if ($row) {
    //     $record_id = $row['client_id'];
    // }

    // $log->error('this is update contact id success ' . $record_id);
    // $sql_update = "UPDATE `vtiger_contactscf` SET `cf_1203` = '0', `cf_1207` = '' WHERE `contactid` = $record_id";
    // $log->error($sql_update);
    // $res_update = mysql_query($sql_update, $conn);
    // if (!$res_update) {
    //     $log->error("Error :: Query failed: " . mysql_error());
    //     die('Query failed: ' . mysql_error());
    // }
}

function get_creditpair_accounts_experian($data)
{
    global $log;
    $conn = database_conn();
    $record = $data['client_id'];
    $log->error('get_creditpair_accounts function is being executed --' . json_encode($data));
    $sql = "SELECT * FROM `vtiger_credit_repair` WHERE creditor LIKE 'Experian' AND  `client_id` = $record and block_type NOT IN ('closed','removed') ORDER BY `vtiger_credit_repair`.`credit_repair_id` DESC LIMIT 1 ";
    $check_script_data = isset($data['check_script_data']) ? $data['check_script_data'] : false;
    $submitted_data = [];
    $result = mysql_query($sql, $conn);
    $j = 0;


    $asql = "SELECT * FROM `automated_data` where client_id = $record ORDER BY `automated_data_id` DESC LIMIT 1";
    $aresult = mysql_query($asql, $conn);
    $created_date = date('Y-m-d H:i:s');
    if (mysql_num_rows($aresult) > 0) {
        while ($arow = mysql_fetch_array($aresult)) {
            $created_date = $arow["date_created"];
        }
    }

    // if (mysql_num_rows($result) > 0) {
    // row_inner data of each row
    while ($row = mysql_fetch_array($result)) {
        $creditor_name = $row["creditor_name"];
        $credit_repair_id = $row["credit_repair_id"];
        $open_date = date('m/d/Y', strtotime($row["open_date"]));
        if (!$check_script_data) {
            $log->error("Calling API through admin panel ");
            $sql_inner = "SELECT * FROM `dispute_account_status` WHERE  `credit_repair_id` = $credit_repair_id AND `client_id` = $record ORDER BY `dispute_account_status`.`dispute_account_id` DESC LIMIT 1 ";
            $result_inner = mysql_query($sql_inner, $conn);
            $log->error("sql_inner: " . $sql_inner);
            if (!$result_inner) {
                $log->error('Error :: fetching data into dispute_account_status table: ' . mysql_error());
                header("HTTP/1.1 500 Server Error");
                $response = array('status' => false, 'message' => mysql_error());
                echo json_encode($response);
                exit;
            }
            if (mysql_num_rows($result_inner) > 0) {
                while ($row_inner = mysql_fetch_array($result_inner)) {
                    $log->error("row_inner: " . json_encode($row_inner));
                    // $accuracy2 = '';
                    // $created_date = $row["created_date"];


                    // $sql_automate = 'SELECT * FROM `automate_default_values` LIMIT 1';
                    // $retval = mysql_query($sql_automate, $conn);
                    // if (!$retval) {
                    //     $log->error('Error :: fetching data into automate_default_values table: ' . mysql_error());
                    //     header("HTTP/1.1 500 Server Error");
                    //     $response = array('status' => false, 'message' => mysql_error());
                    //     echo json_encode($response);
                    //     exit;
                    // }
                    // $result = mysql_fetch_assoc($retval);

                    $credit_repair_id = $row_inner['credit_repair_id'];
                    // $ownership = ($result['dispute_ownership_transunion']) ? $result['dispute_ownership_transunion'] : '';
                    // $accuracy1 = isset($result['dispute_accuracy_transunion']) ? $result['dispute_accuracy_transunion'] : '';
                    // $comment_message = isset($result['dispute_comment_transunion']) ? $result['dispute_comment_transunion'] : '';

                    // $insert_query = "INSERT INTO transunion_dispute_account_status(client_id,credit_repair_id,ownership,accuracy1,accuracy2,comment,reference_number,status_text,submitted_on,estimated_completion_date,created_date) VALUES
                    // ('$record','$credit_repair_id','$ownership','$accuracy1','$accuracy2','$comment_message','','In-Progress',NULL,NULL,'$created_date')";
                    // $retval = mysql_query($insert_query, $conn);
                    // if (!$retval) {
                    //     $log->error('Error :: inserting data into transunion_dispute_account_status table: ' . mysql_error());
                    //     header("HTTP/1.1 500 Server Error");
                    //     $response = array('status' => false, 'message' => mysql_error());
                    //     echo json_encode($response);
                    //     exit;
                    // }
                    $submitted_data[$j]['creditor_name'] = $creditor_name;
                    $submitted_data[$j]['open_date'] = $open_date;
                    $submitted_data[$j]['credit_repair_id'] = $credit_repair_id;
                    // $submitted_data[$j]['accuracy'] = $accuracy1;
                    // $submitted_data[$j]['comment'] = $comment_message;
                    // $submitted_data[$j]['ownership'] = $ownership;
                }
            }
        } else {
            $log->error("Calling API through pthon script ");

            // $sql_automate = 'SELECT * FROM `automate_default_values` LIMIT 1';
            // $retval = mysql_query($sql_automate, $conn);
            // if (!$retval) {
            //     $log->error('Error :: fetching data into automate_default_values table: ' . mysql_error());
            //     header("HTTP/1.1 500 Server Error");
            //     $response = array('status' => false, 'message' => mysql_error());
            //     echo json_encode($response);
            //     exit;
            // }
            // $result = mysql_fetch_assoc($retval);

            // // $credit_repair_id = $credit_repair_id;
            // $ownership = ($result['dispute_ownership_transunion']) ? $result['dispute_ownership_transunion'] : '';
            // $accuracy1 = isset($result['dispute_accuracy_transunion']) ? $result['dispute_accuracy_transunion'] : '';
            // $comment_message = isset($result['dispute_comment_transunion']) ? $result['dispute_comment_transunion'] : '';
            // $accuracy2 = '';
            // $created_date = $row["created_date"];


            // $insert_query = "INSERT INTO transunion_dispute_account_status(client_id,credit_repair_id,ownership,accuracy1,accuracy2,comment,reference_number,status_text,submitted_on,estimated_completion_date,created_date) VALUES
            // ('$record','$credit_repair_id','$ownership','$accuracy1','$accuracy2','$comment_message','','In-Progress',NULL,NULL,'$created_date')";
            // $retval = mysql_query($insert_query, $conn);
            // if (!$retval) {
            //     $log->error('Error :: inserting data into transunion_dispute_account_status table: ' . mysql_error());
            //     header("HTTP/1.1 500 Server Error");
            //     $response = array('status' => false, 'message' => mysql_error());
            //     echo json_encode($response);
            //     exit;
            // }
            $submitted_data[$j]['creditor_name'] = $creditor_name;
            $submitted_data[$j]['open_date'] = $open_date;
            $submitted_data[$j]['credit_repair_id'] = $credit_repair_id;
            // $submitted_data[$j]['accuracy'] = $accuracy1;
            // $submitted_data[$j]['comment'] = $comment_message;
            // $submitted_data[$j]['ownership'] = $ownership;
            // pre($submitted_data);
        }
    }
    // }

    $data['status'] = true;
    $data['accounts'] = $submitted_data;
    $log->error("Got the data of dispute account by automation" . json_encode($data));
    // Close the connection when done
    mysql_close($conn);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function experian_success_dispute($data)
{
    global $log;
    $conn = database_conn();
    $record = $data['client_id'];
    $current_date = $data['current_date'];
    $log->error('experian_success_dispute function is being executed --' . json_encode($data));
    $update_sql = "UPDATE experian_dispute_error 
                    SET status = 'Success', status_text = 'Success'
                    WHERE status like 'In-progress' AND date(created_datetime) = '$current_date' AND client_id = $record";
    $log->error($update_sql);
    // Execute the update query
    if (mysql_query($update_sql, $conn)) {
        $log->error("Status updated to 'Completed' for automated_data_id $record");
    }

    $data['status'] = true;

    $log->error("experian_success_dispute -- Got the data of dispute account by automation" . json_encode($data));
    // Close the connection when done
    mysql_close($conn);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function experian_failed_dispute($data)
{
    global $log;
    $conn = database_conn();
    $record = $data['client_id'];
    $current_date = $data['current_date'];
    $log->error('experian_failed_dispute function is being executed --' . json_encode($data));
    $update_sql = "UPDATE experian_dispute_error 
                    SET status = 'Failed', status_text = 'Due to already request place'
                    WHERE status like 'In-progress' AND date(created_datetime) = '$current_date' AND client_id = $record";
    $log->error($update_sql);
    // Execute the update query
    if (mysql_query($update_sql, $conn)) {
        $log->error("Status updated to 'Completed' for automated_data_id $record");
    }

    $data['status'] = true;

    $log->error("experian_failed_dispute -- Got the data of dispute account by automation" . json_encode($data));
    // Close the connection when done
    mysql_close($conn);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function error_equifax_user($data)
{
    global $log;
    $log->error('error_experian_user function is being executed');
    $automated_data_id = $data['automated_data_id'];
    $error_message = isset($data['error_message']) ? $data['error_message'] : 'Error';
    // Create connection
    $conn = database_conn();

    $update_sql = "UPDATE automated_data 
                    SET auto_import_status_equifax = 'Error', auto_import_status_text_equifax = '$error_message'
                    WHERE automated_data_id = $automated_data_id and auto_import_status_equifax LIKE 'Inprogress'";
    $log->error("error_experian_user Status updated to 'Error' for automated_data_id $update_sql");
    // Execute the update query
    if (mysql_query($update_sql, $conn)) {
        $log->error("error_experian_user Status updated to 'Error' for automated_data_id $automated_data_id");
    }
}

function check_exist($account_name_array, $provide_by, $record_id)
{
    global $log;
    $createddate = date('Y-m-d H:i:s');
    $deleted_accounts = [];
    $deleted_account_block_type = [];
    $delete_count = 0;
    $conn = database_conn();
    if (!$conn) {
        die('Could not connect: check_exist() 4718 ' . mysql_error());
    }
    $sql_dispute = "SELECT * FROM `vtiger_credit_repair` WHERE display_status NOT LIKE 'Deleted' AND block_type NOT LIKE 'removed' AND `creditor`='$provide_by' AND `client_id` = $record_id ";
    $log->error($sql_dispute);
    $result_dispute = mysql_query($sql_dispute, $conn);
    if (!$result_dispute) {
        die('Could not select data check_exist() 9550 :  ' . mysql_error());
    }

    if (mysql_num_rows($result_dispute) > 0) {
        while ($row = mysql_fetch_array($result_dispute)) {
            $creditor_name = trim($row["creditor_name"]);
            $account_block_type = trim($row["block_type"]);
            if ($account_block_type == 'late') {
                $account_block_type = 'Late Payment DELETED';
            } else if ($account_block_type == 'charged') {
                $account_block_type = 'Charged Off Account';
            } else {
                $account_block_type = str_replace('_', ' ', $account_block_type);
                $account_block_type = ucwords($account_block_type);
                $account_block_type = $account_block_type . " Account";
            }

            $credit_repair_id = $row["credit_repair_id"];
            if (in_array($creditor_name, $account_name_array)) {
                // do nothing
            } else {
                $delete_count = $delete_count + 1;
                $deleted_accounts[] = $creditor_name;
                $deleted_account_block_type[] = $account_block_type;
                $sqlu = "UPDATE vtiger_credit_repair SET display_status='Deleted',modified_date='$createddate',block_type='removed' WHERE credit_repair_id=" . $credit_repair_id;
                $retval = mysql_query($sqlu, $conn);
            }
        }
    }
    $log->error('delete count : ' . $delete_count);
    $log->error($deleted_accounts);
    if ($delete_count > 0 && $provide_by != 'Equifax') {
        sendNotificationAlert($record_id, $deleted_accounts, strtolower($provide_by), $deleted_account_block_type);
    }
}


function sendNotificationAlert($client_id, $deleted_accounts, $creditor = 'transunion', $deleted_account_block_type)
{
    global $log;

    $conn = database_conn();
    if (!$conn) {
        die('Could not connect: ' . mysql_error());
    }
    $data_exists = false;
    $message_equifax = '<table>';
    $message_transunion = '<table>';
    $message_experian = '<table>';
    $mail_send = false;
    $equifax_account = false;
    $transunion_account = false;
    $experian_account = false;

    foreach ($deleted_accounts as $key => $row) {
        $account_name = $row;
        if (!empty($account_name) && $account_name != '' && $account_name != '-') {
            $account_block_type = $deleted_account_block_type[$key];
            if ($creditor == 'transunion') {
                $transunion_account = true;
                $message_transunion .= "<tr><td><li>Remark code removed from $account_name, the following remarks were removed from this account:$account_block_type</li></td></tr>";
            }
            if ($creditor == 'experian') {
                $experian_account = true;
                $message_experian .= "<tr><td><li>Remark code removed from $account_name, the following remarks were removed from this account:$account_block_type</li></td></tr>";
            }
            if ($creditor == 'equifax') {
                $equifax_account = true;
                $message_equifax .= "<tr><td><li>Remark code removed from $account_name, the following remarks were removed from this account:$account_block_type</li></td></tr>";
            }
            $mail_send = true;
            $data_exists = true;
        }
    }

    $message_equifax .= '</table>';
    $message_transunion .= '</table>';
    $message_experian .= '</table>';

    $log->error($client_id . ' This is creditor type where removed remark email is being sent => ' . $creditor);
    $log->error($message_equifax);
    $log->error($message_transunion);
    $log->error($message_experian);
    $log->error($deleted_accounts);

    // get client detail 
    $sql1 = "SELECT vtiger_contactscf.cf_929,vtiger_contactscf.cf_881, vtiger_contactdetails .mobile,vtiger_contactdetails.email,vtiger_contactdetails.firstname,vtiger_contactdetails.lastname FROM `vtiger_contactdetails` INNER JOIN vtiger_contactscf ON vtiger_contactscf.contactid=vtiger_contactdetails.contactid WHERE vtiger_contactdetails.`contactid`=" . $client_id;

    $result1 = mysql_query($sql1, $conn);
    //fetch record from database
    $client_email = $client_name = $client_mobile = "";

    if (mysql_num_rows($result1) > 0) {
        while ($row1 = mysql_fetch_array($result1)) {
            $client_email = $row1['email'];
            $client_name = $row1['firstname'];
            $client_mobile = $row1['mobile'];
        }
    }

    $cSession = curl_init();

    curl_setopt($cSession, CURLOPT_URL, "https://portal.canadacreditrepairs.ca/vtiger_api.php?mode=email_data&template_id=25");
    curl_setopt($cSession, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($cSession, CURLOPT_HEADER, false);
    curl_setopt($cSession, CURLOPT_SSL_VERIFYPEER, false);

    $result = curl_exec($cSession);
    curl_close($cSession);
    $result = json_decode($result, true);

    $subject1 = $result['subject'];
    $message1 = $result['message'];

    $from_title_equifax = "%equifax_title_start%";
    $to_title_equifax = "%equifax_title_end%";
    $from_title_transunion = "%transunion_title_start%";
    $to_title_transunion = "%transunion_title_end%";

    //added by umang patel 17-05-24
    $from_title_experian = "%experian_title_start%";
    $to_title_experian = "%experian_title_end%";

    if ($transunion_account) {
        $message1 = str_replace('%transunion_data%', $message_transunion, $message1);
    } else {
        $message1 = str_replace('%transunion_data%', '', $message1);
        $message1 = replace_between($message1, $from_title_transunion, $to_title_transunion, '');
    }
    if ($equifax_account) {
        $message1 = str_replace('%equifax_data%', $message_equifax, $message1);
    } else {
        $message1 = str_replace('%equifax_data%', '', $message1);
        $message1 = replace_between($message1, $from_title_equifax, $to_title_equifax, '');
    }
    if ($experian_account) {
        $message1 = str_replace('%experian_data%', $message_experian, $message1);
    } else {
        $message1 = str_replace('%experian_data%', '', $message1);
        $message1 = replace_between($message1, $from_title_experian, $to_title_experian, '');
    }


    $message1 = str_replace('%equifax_title_start%', '', $message1);
    $message1 = str_replace('%equifax_title_end%', '', $message1);
    $message1 = str_replace('%transunion_title_start%', '', $message1);
    $message1 = str_replace('%transunion_title_end%', '', $message1);

    //added by umangpatel 17-05-24
    $message1 = str_replace('%experian_title_start%', '', $message1);
    $message1 = str_replace('%experian_title_end%', '', $message1);

    $message1 = str_replace('%full_name%', $client_name, $message1);

    $log->error("value of mail_send variable = ");
    $log->error($mail_send);
    if ($mail_send && $data_exists) {
        $log->error("mail send function called.");
        if ($client_id == 370399) {
            $client_email = 'harshit.ashapurasoftech@gmail.com';
        }
        sendMail($client_email, $subject1, $message1, $client_id);
        $textMessage = $message1;

        $textMessage = str_replace("<p></p>", "", $textMessage);
        $textMessage = str_replace("<p>", "#*P*#", $textMessage);
        $textMessage = str_replace("\n", "", $textMessage);
        $textMessage = str_replace("#*P*#", "\n", $textMessage);
        $textMessage = str_replace("</p>", "", $textMessage);
        $textMessage = str_replace("<br/><br/>", "", $textMessage);
        $textMessage = str_replace("<br/>", "\n", $textMessage);
        $textMessage = str_replace("\n\n\n", "\n", $textMessage);
        $textMessage = str_replace("\n\n", "\n", $textMessage);
        $textMessage = str_replace("\n", "\n\n", $textMessage);
        $textMessage = str_replace("&nbsp;", " ", $textMessage);
        $textMessage = str_replace("&", "", $textMessage);

        var_dump($textMessage);
        $messageSms = strip_tags($textMessage);
        var_dump($messageSms);
        // $messageSms = "$textMessage";

        $parts = explode("Remark code", $messageSms);
        $result = array_shift($parts);
        foreach ($parts as $key => $part) {
            if ($key == 0) {
                $result .= "- Remark code" . $part;
                continue;
            }
            $result .= "\n\n- Remark code" . $part;
        }
        $messageSms = $result;
        // if($client_id==370399){
        //     $client_mobile = '2149359893';
        // }
        sendTextMessage($client_mobile, $messageSms, $client_id);
    } else {
        $log->error("Mail not sent.");
        // echo "no mail";
    }
    return true;
}

function replace_between($str, $needle_start, $needle_end, $replacement)
{
    $pos = strpos($str, $needle_start);
    $start = $pos === false ? 0 : $pos + strlen($needle_start);

    $pos = strpos($str, $needle_end, $start);
    $end = $start === false ? strlen($str) : $pos;

    return substr_replace($str, $replacement, $start, $end - $start);
}


function sendMail($mail_to, $subject, $message, $client_id)
{
    global $log;
    $log->error('sendMail function called.');
    $domain = "creditfreedomrestoration.com";
    $api_key = getenv("MAILGUN_API_KEY");
    $url = "https://api.mailgun.net/v3/$domain/messages";

    $from = 'melissa@creditfreedomandrestoration.com';
    $to = $mail_to;

    $parameters = array(
        'from' => $from,
        'to' => $to,
        'subject' => $subject,
        'html' => $message,
    );
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_USERPWD, "api:$api_key");

    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: multipart/form-data'));
    curl_setopt($ch, CURLOPT_POSTFIELDS, $parameters);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

    $y = curl_exec($ch);
    $log->error($y);
    // if(curl_errno($ch)){
    //     print_r(curl_error($ch));exit;
    // }
    captureLog($client_id, $from, $to, $subject, $message, 'mail', 'accounts_removed_alert');

    curl_close($ch);
    return true;
}

function sendTextMessage($number, $text_message, $client_id)
{
    global $log;
    $log->error('sendTextMessage function called.');
    $t_id = getenv("TWILIO_ACCOUNT_SID");
    $token = getenv("TWILIO_AUTH_TOKEN");
    //$url = "https://api.twilio.com/2010-04-01/Accounts/$t_id/SMS/Messages";
    $url = "https://api.twilio.com/2010-04-01/Accounts/$t_id/Messages.json";

    $from = "+19032895145";
    $to = $number; // twilio trial verified number
    // $to = '+919574064060';
    $body = strip_tags($text_message);
    $data = array(
        'From' => $from,
        'To' => $to,
        'Body' => $body,
    );
    $log->error($data);
    $post = http_build_query($data);
    $x = curl_init($url);
    curl_setopt($x, CURLOPT_POST, true);
    curl_setopt($x, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($x, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($x, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
    curl_setopt($x, CURLOPT_USERPWD, "$t_id:$token");
    curl_setopt($x, CURLOPT_POSTFIELDS, $post);
    $y = curl_exec($x);
    captureLog($client_id, $from, $to, 'Removed Alert', $body, 'sms', 'accounts_removed_alert');
    curl_close($x);

    $conn = database_conn();
    $createddate = date('Y-m-d H:i:s');
    $message_date = date('m-d-Y h:i a');
    $notification_msg = "Removed alert has been sent for Experian at $message_date";
    $sql_noti = "INSERT INTO vtiger_credit_notification (record_id, notification_msg,notification_type, createddate) VALUES ($client_id, '$notification_msg','autoimport', '$createddate')";
    $retval_noti = mysql_query($sql_noti, $conn);
}


function whats_change_experian($data, $provide_by = 'experian')
{

    global $log;
    $record_id = $data['record_id'];
    $created_date = date('Y-m-d H:i:s');
    $comments = $data['data'];
    $credit_score = $data['credit_score'];
    $score_date = date('Y-m-d');
    $score = isset($data['score']) ? str_replace(["pts", "pt", "_"], "", $data['score']) : 0;


    $conn = database_conn();


    $sqli = "INSERT INTO credit_score_data (client_id, score, creditor, score_point,score_date, createddate)
    VALUES ('$record_id', '$credit_score','$provide_by', '$score', '$score_date' ,'$created_date')";
    $retval = mysql_query($sqli, $conn);

    if (!$retval) {
        $log->error('Error :: inserting data into credit score table: ' . mysql_error());
        header("HTTP/1.1 500 Server Error");
        $response = array('status' => false, 'message' => mysql_error());
        echo json_encode($response);
        exit;
    }

    $sqli = "SELECT * FROM `credit_score_data` where client_id = '$record_id' AND creditor = '$provide_by' order by score_id desc limit 1";
    $result = mysql_query($sqli, $conn);

    if (!$result) {
        $log->error('Error :: inserting data into credit score table: ' . mysql_error());
        header("HTTP/1.1 500 Server Error");
        $response = array('status' => false, 'message' => mysql_error());
        echo json_encode($response);
        exit;
    }
    $row = mysql_fetch_assoc($result);
    $score_id = $row['score_id'];
    foreach ($comments as $comment) {
        $sqli = "INSERT INTO credit_update_data (score_id, detail_comment1, detail_comment2, createddate)
        VALUES ('$score_id', '" . $comment['comment1'] . "', '" . $comment['comment2'] . "', '$created_date')";
        $retval = mysql_query($sqli, $conn);
    }
    sendMailWithWhatChangedStatus($record_id);

}


function dispute_update_data($data, $provide_by = 'TransUnion')
{
    global $log;
    $conn = database_conn();
    $rowDatas = [];
    // --- Loop through each record ---
    foreach ($data['data']['records'] as $record) {

        $file_id = mysql_real_escape_string($data['data']['file_id']);
        $client_id = (int) $data['client_id'];
        $account_number = mysql_real_escape_string($record['account_number']);
        $account_name = mysql_real_escape_string($record['account_name']);
        $result_text = mysql_real_escape_string($record['result_text']);
        $date_opened = date('Y-m-d', strtotime($record['date_opened']));
        $report_created = date('Y-m-d', strtotime($data['data']['report_created_on']));

        // ✅ Check if record already exists
        $sql = "
            SELECT * FROM dispute_details_updates 
            WHERE file_id = '$file_id' 
            AND client_id = $client_id
            AND account_number LIKE '$account_number' 
            AND account_name LIKE '$account_name'
            AND report_created_on = '$report_created'
            AND date_opened = '$date_opened'
            AND creditor LIKE '$provide_by'
            LIMIT 1
        ";
        //AND result_text LIKE '$result_text'
        $rowData = [
            'file_id' => $file_id,
            'account_number' => $record['account_number'],
            'account_name' => $record['account_name'],
            'result_text' => $record['result_text'],
            'date_opened' => $date_opened,
            'report_created_on' => $report_created,
            'creditor' => $provide_by
        ];



        $check = mysql_query($sql, $conn);
        $log->error($sql);

        if (mysql_num_rows($check) == 0) {
            // ✅ Insert new record
            $sql = "
                INSERT INTO dispute_details_updates 
                    (client_id, file_id, account_number, account_name, result_text, date_opened, report_created_on, creditor) 
                VALUES 
                    ($client_id, '$file_id', '$account_number', '$account_name', '$result_text', '$date_opened', '$report_created', '$provide_by')
            ";
            $check = mysql_query($sql, $conn);

            if ($check) {
                // echo "✅ Inserted new record for account: $account_number<br>";
                $log->error("Inserted new record for account: $account_number");
                $rowDatas[] = $rowData;
            } else {
                // echo "❌ Insert failed: " . $conn->error . "<br>";
                $log->error("Insert failed for account: $account_number - " . $conn->error);
            }
        } else {
            $row = mysql_fetch_assoc($check);
            if ($row && $row['result_text'] != $result_text) {
                $sql = "UPDATE dispute_details_updates  SET result_text = '$result_text' WHERE id = " . $row['id'];
                $check = mysql_query($sql, $conn);
                if ($check) {
                    // echo "🔄 Updated record for account: $account_number<br>";
                    $log->error("Updated record for account: $account_number");
                    $rowDatas[] = $rowData;
                } else {
                    // echo "❌ Update failed: " . $conn->error . "<br>";
                    $log->error("Update failed for account: $account_number - " . $conn->error);
                }
            } else {
                $log->error("Record already exists for account: $account_number");
                // echo "⚠️ Record already exists for account: $account_number<br>";
            }

        }
    }
    $log->error('Dispute data update going for mail');
    $log->error($rowDatas);
    if (count($rowDatas) > 0) {
        // sendMailWithDisputeData($client_id, $rowDatas);
    }
}

function sendMailWithDisputeData($record_id, $rowDatas)
{
    global $log;
    $conn = database_conn();

    $sql = "SELECT vtiger_contactscf.cf_929,vtiger_contactscf.cf_767,vtiger_contactscf.cf_769,vtiger_contactscf.cf_771,vtiger_contactscf.cf_773,vtiger_contactscf.cf_775,vtiger_contactscf.cf_777,vtiger_contactscf.cf_784,vtiger_contactsubdetails.birthday,vtiger_contactdetails.firstname,vtiger_contactdetails.lastname,vtiger_contactdetails.email, vtiger_contactdetails.phone,vtiger_contactdetails.mobile,vtiger_contactdetails.mobile FROM vtiger_contactsubdetails INNER JOIN vtiger_contactdetails ON vtiger_contactsubdetails.contactsubscriptionid=vtiger_contactdetails.contactid INNER JOIN vtiger_contactscf ON vtiger_contactscf.contactid=vtiger_contactdetails.contactid WHERE vtiger_contactdetails.contactid=$record_id;";

    $result = mysql_query($sql, $conn);
    $template = '';
    $postalcode = $firstname = $lastname = $phone = $mobile = $birthday = '';
    if (mysql_num_rows($result) > 0) {
        // output data of each row
        while ($row = mysql_fetch_array($result)) {
            $firstname = $row["firstname"];
            $lastname = $row["lastname"];
            $phone = $row["phone"];
            $mobile = $row["mobile"];
            $birthday = $row["birthday"];
            $email = $row["email"];
            $social_security_number = $row["cf_784"];
            $address = $row["cf_767"];
            $postalcode = $row["cf_771"];
            $city = $row["cf_773"];
            $country = $row["cf_775"];
            $state = $row["cf_777"];
        }
    }

    $log->error('sendMailWithDisputeData function is being executed');
    $log->error('record_id = ' . $record_id);
    $email_template_id = 37;
    $sql_email = "SELECT * FROM `vtiger_email_data` WHERE `id` = $email_template_id";
    $result_email = mysql_query($sql_email, $conn);
    $type = 'all';
    $data_email = array('subject' => '', 'message' => '', 'type' => '');
    if (mysql_num_rows($result_email) > 0) {
        while ($row = mysql_fetch_array($result_email)) {
            $subject = $row['subject'];
            $message = $row['message'];
            $type = $row['type'];
            $data_email = array(
                'subject' => $subject,
                'message' => $message,
                'type' => $type,
            );
        }
    } else {
        $data_email = array('subject' => '', 'message' => '', 'type' => '');
    }

    $subject = $data_email['subject'];
    $message = $data_email['message'];
    $message = str_replace('%full_name%', $firstname . ' ' . $lastname, $message);

    $all_text = '';
    foreach ($rowDatas as $rowData) {
        $message_email = "<p>- Your Account <b>%account_name%</b> dispute details are updated. %result_text%</p>";
        $all_text .= $message_email;
        $all_text = str_replace('%account_name%', $rowData['account_name'], $all_text);
        $all_text = str_replace('%result_text%', $rowData['result_text'], $all_text);
    }
    $message = str_replace('%all_text%', $all_text, $message);

    if ($type == 'all' || $type == 'email') {
        $domain = "creditfreedomrestoration.com";
        $api_key = getenv("MAILGUN_API_KEY");
        $url = "https://api.mailgun.net/v3/$domain/messages";

        $from = 'melissa@creditfreedomandrestoration.com';
        // $to = 'harshit.ashapurasoftech@gmail.com';//$email;
        $to = $email;
        $parameters = array(
            'from' => $from,
            'to' => $to,
            'subject' => $subject,
            'html' => $message
        );


        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_USERPWD, "api:$api_key");

        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $parameters);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $y = curl_exec($ch);
        curl_close($ch);
        captureLog($record_id, $from, $to, $subject, $message, 'mail', 'dispute_data_update');
    }

    // $message = strip_tags($message);
    $textMessage = $message;
    $textMessage = str_replace("<p></p>", "", $textMessage);
    $textMessage = str_replace("<p>", "#*P*#", $textMessage);
    $textMessage = str_replace("\n", "", $textMessage);
    $textMessage = str_replace("#*P*#", "\n", $textMessage);
    $textMessage = str_replace("</p>", "", $textMessage);
    $textMessage = str_replace("<br/><br/>", "", $textMessage);
    $textMessage = str_replace("<br/>", "\n", $textMessage);
    $textMessage = str_replace("\n\n\n", "\n", $textMessage);
    $textMessage = str_replace("\n\n", "\n", $textMessage);
    $textMessage = str_replace("\n", "\n\n", $textMessage);
    $textMessage = str_replace("&nbsp;", " ", $textMessage);
    $textMessage = str_replace("&", "", $textMessage);

    // var_dump($textMessage);
    // var_dump($messageSms);
    $messageSms = "$textMessage";

    $messageSms = strip_tags($textMessage);
    $parts = explode("- Your Account", $messageSms);
    $result = array_shift($parts);
    foreach ($parts as $key => $part) {
        if ($key == 0) {
            $result .= "- Your Account" . $part;
            continue;
        }
        $result .= "\n\n- Your Account" . $part;
    }
    $message = $result;

    // echo $message;exit;
    if ($type == 'all' || $type == 'sms') {
        // send text sms 
        $t_id = getenv("TWILIO_ACCOUNT_SID");
        $token = getenv("TWILIO_AUTH_TOKEN");
        $url = "https://api.twilio.com/2010-04-01/Accounts/$t_id/Messages.json";

        $from = "+19032895145";
        $to = $mobile; // twilio trial verified number
        // $to = "3022301986";
        $body = $message;
        $data = array(
            'From' => $from,
            'To' => $to,
            'Body' => $body,
        );
        $post = http_build_query($data);
        $x = curl_init($url);
        curl_setopt($x, CURLOPT_POST, true);
        curl_setopt($x, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($x, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($x, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
        curl_setopt($x, CURLOPT_USERPWD, "$t_id:$token");
        curl_setopt($x, CURLOPT_POSTFIELDS, $post);
        $y = curl_exec($x);
        $log->error($y);
        curl_close($x);
        captureLog($record_id, $from, $to, $subject, $message, 'sms', 'dispute_data_update');
    }
    return true;
}

function sendmail_creditcard_use($id, $credit_card_use)
{
    global $log;
    $extensionNumber = '';

    $dbhost = '10.136.0.3';
    $dbuser = 'crmuser';
    $dbpass = 'H72TA6466ffffbLuYRq4Il1s';
    $dbname = 'crmcredi_crm';

    $conn = mysql_connect($dbhost, $dbuser, $dbpass);
    $sql1 = "SELECT vtiger_contactscf.cf_929, vtiger_contactdetails.mobile,vtiger_contactdetails.firstname, vtiger_contactdetails.lastname,vtiger_contactdetails.email FROM `vtiger_contactdetails` INNER JOIN vtiger_contactscf ON vtiger_contactscf.contactid=vtiger_contactdetails.contactid WHERE vtiger_contactdetails.`contactid`=" . $id;
    $client_id = $id;
    $log->error($sql1);
    mysql_select_db($dbname);
    $result1 = mysql_query($sql1, $conn);
    $fl_name = $mobile = $email = '';
    if (mysql_num_rows($result1) > 0) {
        while ($row1 = mysql_fetch_array($result1)) {
            $fl_name = $row1["firstname"] . ' ' . $row1["lastname"];
            $email = $row1["email"];
            $telecompartners = $row1["cf_929"];
            $mobile = $row1["mobile"];
            $mobile = str_replace('(', '', $mobile);
            $mobile = str_replace(')', '', $mobile);
            $mobile = str_replace(' ', '', $mobile);
            $mobile = str_replace('-', '', $mobile);
        }
    }

    $e = "melissa@creditfreedomandrestoration.com";
    $p = "credit123";

    /*         * *********************** get email data (start) ************************ */
    $email_template_id = '23';
    $sql_email = "SELECT * FROM `vtiger_email_data` WHERE `id` = $email_template_id ";
    mysql_select_db($dbname);
    $result_email = mysql_query($sql_email, $conn);
    $data_email = array('subject' => '', 'message' => '', 'type' => '');
    if (mysql_num_rows($result_email) > 0) {
        while ($row = mysql_fetch_array($result_email)) {
            $subject = $row['subject'];
            $message = $row['message'];
            $type = $row['type'];
            $data_email = array(
                'subject' => $subject,
                'message' => $message,
                'type' => $type,
            );
        }
    } else {
        $data_email = array('subject' => '', 'message' => '', 'type' => '');
    }
    /* * *********************** get email data (end) ************************ */
    $log->error($data_email);


    $subject = $data_email['subject'];
    $message = $data_email['message'];
    $message = str_replace('%full_name%', $fl_name, $message);

    $message = str_replace('%credit_card_use%', $credit_card_use, $message);
    $message = str_replace('&nbsp;', '', $message);
    $message = str_replace('&', '', $message);

    $message = strip_tags($message);

    // twilio code to send sms start
    $t_id = getenv("TWILIO_ACCOUNT_SID");
    $token = getenv("TWILIO_AUTH_TOKEN");
    $url = "https://api.twilio.com/2010-04-01/Accounts/$t_id/Messages.json";

    $from = "+19032895145";
    $to = $mobile; // twilio trial verified number
    $body = $message;
    $data = array(
        'From' => $from,
        'To' => $to,
        'Body' => $body,
    );
    $post = http_build_query($data);
    $x = curl_init($url);
    curl_setopt($x, CURLOPT_POST, true);
    curl_setopt($x, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($x, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($x, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
    curl_setopt($x, CURLOPT_USERPWD, "$t_id:$token");
    curl_setopt($x, CURLOPT_POSTFIELDS, $post);
    $y = curl_exec($x);
    curl_close($x);

    captureLog($client_id, $from, $to, $subject, $body, 'sms', 'credit_card_use');
    $log->error($message);
    $log->error($subject);
    $log->error($y);
    $result = sendMailWithOutAttachment($email, $subject, $body);
    $from_mail = 'melissa@creditfreedomandrestoration.com';
    captureLog($client_id, $from_mail, $email, $subject, $body, 'mail', 'credit_card_use');
    return true;
}

function sendMailWithOutAttachment($mail_to, $subject, $message)
{
    // $filepath = __dir__."/../../mpdf/examples/all_files/$filename";
    global $log;
    $domain = "creditfreedomrestoration.com";
    $api_key = getenv("MAILGUN_API_KEY");
    $url = "https://api.mailgun.net/v3/$domain/messages";

    $from = 'melissa@creditfreedomandrestoration.com';
    $to = $mail_to;

    $parameters = array(
        'from' => $from,
        'to' => $to,
        'subject' => $subject,
        'html' => $message,
        //'attachment[0]' => curl_file_create($filepath, 'application/pdf', $filename)
    );
    $log->error($parameters);
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_USERPWD, "api:$api_key");

    curl_setopt($ch, CURLOPT_POST, true);
    // curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: multipart/form-data'));
    curl_setopt($ch, CURLOPT_POSTFIELDS, $parameters);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $y = curl_exec($ch);
    // $log->error($y);
    curl_close($ch);
    return true;
}

function add_autobot_notification($record_id, $provider, $type = 'import')
{
    global $log;
    $log->error('add_autobot_notification function is being executed');
    $log->error("record_id = $record_id, provider = $provider, type = $type");
    $conn = database_conn();

    $createddate = date('Y-m-d H:i:s');
    $message_date = date('m-d-Y h:i a');
    if ($provider == 'Equifax') {

    } else if (strtolower($provider) == 'experian') {

    } else if ($provider == 'Transunion' || strtolower($provider) == 'transunion') {
        $notification_msg = "";
        if ($type == 'import') {
            $notification_msg = "Auto Bot has picked this profile for transunion import at $message_date";
        } elseif ($type == 'dispute') {
            $notification_msg = "Auto Bot has picked this profile for transunion dispute at $message_date";
        }
        $sql_noti = "INSERT INTO vtiger_credit_notification (record_id, notification_msg,notification_type, createddate) VALUES ('$record_id', '$notification_msg','autoimport', '$createddate')";
        $log->error("record_id = $record_id, $sql_noti");
        $retval_noti = mysql_query($sql_noti, $conn);
        //$notification_msg = "Auto bot has submitted this profile for creditkarma dispute at $msg_date";

    }

}

function sendMailWithWhatChangedStatus($record_id)
{
    global $log;
    $conn = database_conn();

    $sql = "SELECT vtiger_contactscf.cf_929,vtiger_contactscf.cf_767,vtiger_contactscf.cf_769,vtiger_contactscf.cf_771,vtiger_contactscf.cf_773,vtiger_contactscf.cf_775,vtiger_contactscf.cf_777,vtiger_contactscf.cf_784,vtiger_contactsubdetails.birthday,vtiger_contactdetails.firstname,vtiger_contactdetails.lastname,vtiger_contactdetails.email, vtiger_contactdetails.phone,vtiger_contactdetails.mobile,vtiger_contactdetails.mobile FROM vtiger_contactsubdetails INNER JOIN vtiger_contactdetails ON vtiger_contactsubdetails.contactsubscriptionid=vtiger_contactdetails.contactid INNER JOIN vtiger_contactscf ON vtiger_contactscf.contactid=vtiger_contactdetails.contactid WHERE vtiger_contactdetails.contactid=$record_id;";

    $result = mysql_query($sql, $conn);
    $template = '';
    $postalcode = $firstname = $lastname = $phone = $mobile = $birthday = '';
    if (mysql_num_rows($result) > 0) {
        // output data of each row
        while ($row = mysql_fetch_array($result)) {
            $firstname = $row["firstname"];
            $lastname = $row["lastname"];
            $phone = $row["phone"];
            $mobile = $row["mobile"];
            $birthday = $row["birthday"];
            $email = $row["email"];
            $social_security_number = $row["cf_784"];
            $address = $row["cf_767"];
            $postalcode = $row["cf_771"];
            $city = $row["cf_773"];
            $country = $row["cf_775"];
            $state = $row["cf_777"];
        }
    }

    $log->error('sendMailWithWhatChangedStatus function is being executed');
    $log->error('record_id = ' . $record_id);
    $email_template_id = 20;
    $sql_email = "SELECT * FROM `vtiger_email_data` WHERE `id` = $email_template_id";
    $result_email = mysql_query($sql_email, $conn);
    $type = 'all';
    $data_email = array('subject' => '', 'message' => '', 'type' => '');
    if (mysql_num_rows($result_email) > 0) {
        while ($row = mysql_fetch_array($result_email)) {
            $subject = $row['subject'];
            $message = $row['message'];
            $type = $row['type'];
            $data_email = array(
                'subject' => $subject,
                'message' => $message,
                'type' => $type,
            );
        }
    } else {
        $data_email = array('subject' => '', 'message' => '', 'type' => '');
    }
    /*     * *********************** get email data (end) ************************ */
    $subject = $data_email['subject'];
    $message = $data_email['message'];
    $message = str_replace('%full_name%', $firstname, $message);
    $message = str_replace('&nbsp;', ' ', $message);
    $message = str_replace('&', '', $message);
    $message = strip_tags($message);
    if ($type == 'all' || $type == 'email') {
        $domain = "creditfreedomrestoration.com";
        $api_key = getenv("MAILGUN_API_KEY");
        $url = "https://api.mailgun.net/v3/$domain/messages";

        $from = 'melissa@creditfreedomandrestoration.com';
        $to = $email;
        $parameters = array(
            'from' => $from,
            'to' => $to,
            'subject' => $subject,
            'text' => $message
        );

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_USERPWD, "api:$api_key");

        curl_setopt($ch, CURLOPT_POST, true);
        // curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: multipart/form-data'));
        curl_setopt($ch, CURLOPT_POSTFIELDS, $parameters);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $y = curl_exec($ch);
        curl_close($ch);
        captureLog($record_id, $from, $to, $subject, $message, 'mail', 'see_what_changed');
    }

    if ($type == 'all' || $type == 'sms') {
        // send text sms 
        $t_id = getenv("TWILIO_ACCOUNT_SID");
        $token = getenv("TWILIO_AUTH_TOKEN");
        $url = "https://api.twilio.com/2010-04-01/Accounts/$t_id/Messages.json";

        $from = "+19032895145";
        $to = $mobile; // twilio trial verified number
        $body = $message;
        $data = array(
            'From' => $from,
            'To' => $to,
            'Body' => $body,
        );
        $post = http_build_query($data);
        $x = curl_init($url);
        curl_setopt($x, CURLOPT_POST, true);
        curl_setopt($x, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($x, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($x, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
        curl_setopt($x, CURLOPT_USERPWD, "$t_id:$token");
        curl_setopt($x, CURLOPT_POSTFIELDS, $post);
        $y = curl_exec($x);
        $log->error($y);
        curl_close($x);
        captureLog($record_id, $from, $to, $subject, $message, 'sms', 'see_what_changed');
    }
    return true;
}
