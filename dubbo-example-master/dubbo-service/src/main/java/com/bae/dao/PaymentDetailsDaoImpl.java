/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.bae.dao;

import com.bae.entity.PaymentDetails;

import org.apache.log4j.Logger;
import org.hibernate.Query;
import org.hibernate.Session;
import org.hibernate.Transaction;
import org.springframework.stereotype.Repository;

/**
 *
 * @author Heng Wai
 */

public class PaymentDetailsDaoImpl extends GenericDaoImpl<PaymentDetails> implements PaymentDetailsDao {
    private static final Logger LOGGER = Logger.getLogger(PaymentDetailsDaoImpl.class);
    public PaymentDetails findByMerbillNo(String billNo) {
        String hql = "from PaymentDetails p where p.merbillNo = :id";
        this.getCurrentSession().beginTransaction();
        Query query = this.getCurrentSession().createQuery(hql);
        query.setString("id", billNo);
        
        PaymentDetails pd = (PaymentDetails) query.uniqueResult();
        return pd;
    }
    public void setValidPayment(PaymentDetails pd) {
        Session session = this.getCurrentSession();
        Transaction tx = session.beginTransaction();
        session.saveOrUpdate(pd);
        tx.commit();
    }
    
}
